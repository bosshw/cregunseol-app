import {compareAssessments} from './engine.js';
// Human preferences remain opinions, not ground-truth labels or accuracy claims.
export function summarizeFeedback(feedback,jobs){
 const byId=new Map(jobs.map(j=>[j.id,j])),traits={};let pairs=0;
 for(const f of feedback){
  const a=byId.get(f.left),b=byId.get(f.right);
  if(!f.blind||!a?.result||!b?.result||a.result.source!=='ai'||b.result.source!=='ai'||f.left===f.right)continue;
  const c=compareAssessments(a.result,b.result);if(!c.sameProfile)continue;pairs++;
  for(const r of c.rows){const v=f.votes?.[r.id];if(!['a','b','tie'].includes(v)||r.a===null||r.b===null)continue;const actual=r.a===r.b?'tie':r.a>r.b?'a':'b';const t=traits[r.id]??={label:r.label,compared:0,matched:0,disagreements:[]};t.compared++;if(v===actual)t.matched++;else t.disagreements.push({left:f.left,right:f.right,reviewer:f.reviewer,human:v,ai:actual});}
 }
 return {pairs,traits:Object.entries(traits).map(([id,t])=>({id,...t,rate:Math.round(t.matched/t.compared*100)}))};
}
