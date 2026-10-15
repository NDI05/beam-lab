const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const M = require('../v3.0/model.js');
const context = { window: { BeamPhysics: M } };
vm.runInNewContext(fs.readFileSync(require.resolve('../v3.0/lessons.js'), 'utf8'), context);
const lessons = context.window.BeamLessons;
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, actual + ' differs from ' + expected);

test('central load uses SI conversion and is zero at both supports', () => {
  const p = M.BRIDGE_DEFAULTS;
  close(M.beamResult(p).maximum, 26.16);
  close(M.beamResult(p).forceKN, 196.2);
  close(M.beamDeflectionAt(0,p),0);
  close(M.beamDeflectionAt(8,p),0);
  close(M.beamDeflectionAt(2,p),17.985);
  close(M.beamDeflectionAt(2,p),M.beamDeflectionAt(6,p));
});
test('the 20% span change uses L cubed and the lesson key is 1.73', () => {
  const p=M.BRIDGE_DEFAULTS;
  close(M.beamResult({...p,L:9.6}).maximum/M.beamResult(p).maximum,1.728);
  assert.equal(lessons.bridge[3].answer,'cube');
  assert.match(lessons.bridge[3].options.find(o=>o.id==='cube').label,/1,73/);
});
test('changing load, E, and I preserves the expected ratios', () => {
  const p=M.BRIDGE_DEFAULTS,base=M.beamResult(p).maximum;
  close(M.beamResult({...p,P:30}).maximum/base,1.5);
  close(M.beamResult({...p,material:'concrete'}).maximum/base,200/30);
  close(M.beamResult({...p,profile:'ibeam'}).maximum/base,.5);
});
test('moving point load respects supports, reciprocity, and the analytic peak', () => {
  const p=M.BRIDGE_DEFAULTS;
  for(const a of [0,1,2,4,6,8]){
    close(M.beamDeflectionAt(0,p,a),0);close(M.beamDeflectionAt(8,p,a),0);
    for(const x of [1,3,5,7])close(M.beamDeflectionAt(x,p,a),M.beamDeflectionAt(a,p,x));
    const result=M.beamResult(p,a);
    for(let i=0;i<=80;i++)assert.ok(M.beamDeflectionAt(i/10,p,a)<=result.maximum+1e-8);
  }
  close(M.beamResult(p,-1).maximum,0);
});
test('Manning area, wetted perimeter, hydraulic radius and discharge use SI', () => {
  const p={width:2,depth:1,slope:.01,roughness:.02};const result=M.flowResult(p);
  close(result.area,2);close(result.perimeter,4);close(result.radius,.5);
  close(result.discharge,6.299605249474366);close(result.velocity,result.discharge/result.area);
  close(M.flowResult(p,0).discharge,0);
});
test('depth changes Q by 35.21% and doubled roughness halves Q and V', () => {
  const base=lessons.flow[1].start;
  close(lessons.flow[1].expected({...base,depth:1.5},base),35.21089721631956);
  const p=lessons.flow[2].start;
  close(M.flowResult({...p,roughness:.03}).discharge/M.flowResult(p).discharge,.5);
  close(M.flowResult({...p,roughness:.03}).velocity/M.flowResult(p).velocity,.5);
});
test('every lesson has reachable experimental conditions and finite expected evidence', () => {
  const candidates={bridge:[{P:30},{material:'concrete'},{profile:'ibeam'},{L:9.6},{profile:'box'}],flow:[{width:3.2},{depth:1.5},{roughness:.03}]};
  for(const track of ['bridge','flow'])lessons[track].forEach((lesson,index)=>{
    const p={...lesson.start,...candidates[track][index]};assert.ok(lesson.target(p),lesson.title);
    assert.ok(Number.isFinite(lesson.expected(p,lesson.start)),lesson.title);
    assert.equal(lesson.options.filter(o=>o.id===lesson.answer).length,1);
    assert.equal(lesson.explanations.filter(o=>o.id===lesson.correctExplanation).length,1);
  });
});
test('the constrained design has a feasible solution and rejects overspending', () => {
  const p=M.BRIDGE_DEFAULTS;
  assert.ok(lessons.bridge[4].target({...p,profile:'box'}));
  assert.equal(lessons.bridge[4].target({...p,profile:'ibeam'}),false);
  close(M.beamResult({...p,profile:'box'}).maximum,17.44);
});
test('decimal comma input is accepted and numeric garbage is not', () => {
  close(M.parseNumber('1,73'),1.73);assert.ok(Number.isNaN(M.parseNumber('1,7abc')));
  assert.ok(Number.isNaN(M.parseNumber('')));assert.ok(M.isClose(M.parseNumber('35,2'),35.210897));
  assert.equal(M.isClose(NaN,3),false);
});
test('answer order is stable within an attempt and varies between attempts', () => {
  const rows=lessons.bridge[0].options;
  assert.deepEqual(M.shuffled(rows,102),M.shuffled(rows,102));
  const seen=new Set(Array.from({length:30},(_,i)=>M.shuffled(rows,i+1).map(o=>o.id).join(',')));
  assert.ok(seen.size>=3);assert.equal(rows[0].id,'linear');
});
test('invalid saved parameters normalize to usable values', () => {
  const p=M.bridgeParameters({P:'bad',L:900,material:'missing',profile:null});
  assert.deepEqual(p,{P:20,L:12,material:'steel',profile:'rectangle'});
  assert.ok(Number.isFinite(M.beamResult(p).maximum));
  const flow=M.flowParameters({depth:'broken',roughness:0});
  assert.ok(Number.isFinite(M.flowResult(flow).discharge));assert.equal(flow.roughness,.008);
});
