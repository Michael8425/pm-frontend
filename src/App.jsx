import { useEffect, useState } from 'react';
import { api } from './api';
import dayjs from 'dayjs';

const Tab = ({label,active,onClick}) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-2xl ${active?'bg-black text-white':'bg-gray-100 hover:bg-gray-200'}`}>{label}</button>
);

const Card = ({title,children,actions}) => (
  <div className="bg-white rounded-2xl p-4 shadow">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="flex gap-2">{actions}</div>
    </div>
    {children}
  </div>
);

function useProjects(){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const reload=()=> api.get('/projects').then(r=>setItems(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{reload();},[]);
  return {items,loading,reload};
}

export default function App(){
  const { items: projects, loading, reload } = useProjects();
  const [activeProject,setActiveProject]=useState(null);
  const [tab,setTab]=useState('Initiation');

  useEffect(()=>{ if(projects.length && !activeProject) setActiveProject(projects[0]); },[projects]);

  const createProject = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    await api.post('/projects', payload); e.target.reset(); await reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Project Manager</h1>
          <div className="flex gap-2">
            {['Initiation','Planning','Execution','Closure'].map(t=> (
              <Tab key={t} label={t} active={tab===t} onClick={()=>setTab(t)} />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid gap-4">
        <Card title="Projects" actions={null}>
          <div className="grid md:grid-cols-3 gap-3">
            <form onSubmit={createProject} className="bg-gray-50 rounded-xl p-3 grid gap-2">
              <h4 className="font-semibold">New Project</h4>
              <input name="name" required placeholder="Name" className="border rounded px-2 py-1"/>
              <div className="grid grid-cols-2 gap-2">
                <input name="sponsor" placeholder="Sponsor" className="border rounded px-2 py-1"/>
                <input name="manager" placeholder="Project Manager" className="border rounded px-2 py-1"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input name="priority" placeholder="Priority" className="border rounded px-2 py-1"/>
                <input name="required_date" type="date" className="border rounded px-2 py-1"/>
              </div>
              <button className="mt-2 bg-black text-white rounded px-3 py-1">Add</button>
            </form>

            {loading ? <div className="p-4">Loading…</div> : projects.map(p => (
              <div key={p.id} onClick={()=>setActiveProject(p)}
                   className={`border rounded-xl p-3 cursor-pointer ${activeProject?.id===p.id? 'ring-2 ring-black':''}`}>
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-gray-600">Sponsor: {p.sponsor||'—'} · PM: {p.manager||'—'}</div>
                <div className="text-xs text-gray-500">Status: {p.status}</div>
              </div>
            ))}
          </div>
        </Card>

        {activeProject && (
          <PhaseRouter tab={tab} project={activeProject} />
        )}
      </main>
    </div>
  );
}

function PhaseRouter({tab, project}){
  if(tab==='Initiation') return <Initiation project={project}/>;
  if(tab==='Planning') return <Planning project={project}/>;
  if(tab==='Execution') return <Execution project={project}/>;
  if(tab==='Closure') return <Closure project={project}/>;
  return null;
}

function Initiation({project}){
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Charter project={project}/>
      <Risks project={project}/>
      <Stakeholders project={project}/>
    </div>
  );
}

function Planning({project}){
  return (
    <div className="grid gap-4">
      <WBS project={project}/>
      <Tasks project={project}/>
      <CommsPlan project={project}/>
    </div>
  );
}

function Execution({project}){
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Changes project={project}/>
      <Meetings project={project}/>
    </div>
  );
}

function Closure({project}){
  return (
    <div className="grid gap-4">
      <Lessons project={project}/>
    </div>
  );
}

function Charter({project}){
  const [item,setItem]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ api.get(`/projects/${project.id}/charter`).then(r=>setItem(r.data)).finally(()=>setLoading(false)); },[project.id]);
  const save=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const payload={
      business_need: fd.get('business_need'),
      product_description: fd.get('product_description'),
      goals: JSON.parse(fd.get('goals')||'[]'),
      constraints: JSON.parse(fd.get('constraints')||'{}'),
      approvers: JSON.parse(fd.get('approvers')||'[]'),
      signed_off: fd.get('signed_off')==='on'
    };
    const { data } = await api.put(`/projects/${project.id}/charter`, payload);
    setItem(data);
  };
  return (
    <Card title="Project Charter" actions={null}>
      {loading? 'Loading…' : (
        <form onSubmit={save} className="grid gap-2">
          <textarea name="business_need" defaultValue={item?.business_need||''} placeholder="Business need / problem" className="border rounded p-2"/>
          <textarea name="product_description" defaultValue={item?.product_description||''} placeholder="Product/service description" className="border rounded p-2"/>
          <textarea name="goals" defaultValue={JSON.stringify(item?.goals||[],null,2)} placeholder='SMART goals (JSON array)' className="border rounded p-2 font-mono text-sm"/>
          <textarea name="constraints" defaultValue={JSON.stringify(item?.constraints||{},null,2)} placeholder='Constraints/Assumptions (JSON object)' className="border rounded p-2 font-mono text-sm"/>
          <textarea name="approvers" defaultValue={JSON.stringify(item?.approvers||[],null,2)} placeholder='Approvers (JSON array)' className="border rounded p-2 font-mono text-sm"/>
          <label className="inline-flex items-center gap-2"><input type="checkbox" name="signed_off" defaultChecked={item?.signed_off}/> Signed off</label>
          <button className="bg-black text-white rounded px-3 py-1 w-max">Save Charter</button>
        </form>
      )}
    </Card>
  );
}

function Risks({project}){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const load=()=> api.get(`/projects/${project.id}/risks`).then(r=>setItems(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{load();},[project.id]);
  const add=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const payload=Object.fromEntries(fd.entries());
    payload.probability=Number(payload.probability); payload.impact=Number(payload.impact);
    await api.post(`/projects/${project.id}/risks`,payload); e.target.reset(); load();
  };
  return (
    <Card title="Risk Register" actions={null}>
      <form onSubmit={add} className="grid md:grid-cols-6 gap-2 bg-gray-50 p-3 rounded-xl">
        <input name="title" placeholder="Risk" className="border rounded px-2 py-1 md:col-span-2"/>
        <input name="trigger" placeholder="Trigger" className="border rounded px-2 py-1"/>
        <input name="mitigation" placeholder="Mitigation" className="border rounded px-2 py-1"/>
        <input name="owner" placeholder="Owner" className="border rounded px-2 py-1"/>
        <select name="probability" className="border rounded px-2 py-1"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>
        <select name="impact" className="border rounded px-2 py-1"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>
        <button className="bg-black text-white rounded px-3 py-1 md:col-span-6 w-max">Add Risk</button>
      </form>
      {loading? 'Loading…' : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">Risk</th><th className="p-2">Prob</th><th className="p-2">Impact</th><th className="p-2">Exposure</th><th className="p-2">Owner</th><th className="p-2">Mitigation</th></tr></thead>
            <tbody>
              {items.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{r.probability}</td>
                  <td className="p-2">{r.impact}</td>
                  <td className="p-2 font-semibold">{r.exposure}</td>
                  <td className="p-2">{r.owner||'—'}</td>
                  <td className="p-2">{r.mitigation||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Stakeholders({project}){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const load=()=> api.get(`/projects/${project.id}/stakeholders`).then(r=>setItems(r.data)).finally(()=>setLoading(false)).catch(()=>setItems([]));
  useEffect(()=>{load();},[project.id]);
  const add=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const payload=Object.fromEntries(fd.entries());
    await api.post(`/projects/${project.id}/stakeholders`,payload); e.target.reset(); load();
  };
  return (
    <Card title="Stakeholders" actions={null}>
      <form onSubmit={add} className="grid md:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl">
        <input name="name" placeholder="Name" className="border rounded px-2 py-1"/>
        <input name="role" placeholder="Role" className="border rounded px-2 py-1"/>
        <input name="influence" placeholder="Influence" className="border rounded px-2 py-1"/>
        <input name="information_needs" placeholder="Information needs" className="border rounded px-2 py-1 md:col-span-2"/>
        <button className="bg-black text-white rounded px-3 py-1 md:col-span-5 w-max">Add Stakeholder</button>
      </form>
      {loading? 'Loading…' : (
        <ul className="divide-y">
          {items.map(s=> (
            <li key={s.id} className="py-2 flex justify-between items-center">
              <div>
                <div className="font-medium">{s.name} <span className="text-xs text-gray-500">({s.role})</span></div>
                <div className="text-xs text-gray-600">Influence: {s.influence||'—'} · Needs: {s.information_needs||'—'}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function WBS({project}){
  const [items,setItems]=useState([]);
  const [title,setTitle]=useState('');
  const load=()=> api.get(`/projects/${project.id}/wbs`).then(r=>setItems(r.data));
  useEffect(()=>{load();},[project.id]);
  const add=async()=>{ if(!title) return; await api.post(`/projects/${project.id}/wbs`,{ title, deliverable: true }); setTitle(''); load(); };
  return (
    <Card title="WBS & Completion Criteria" actions={null}>
      <div className="flex gap-2 mb-2">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Add deliverable/task" className="border rounded px-2 py-1"/>
        <button onClick={add} className="bg-black text-white rounded px-3 py-1">Add</button>
      </div>
      <ul className="list-disc pl-5">
        {items.map(it=> (
          <li key={it.id} className="mb-1">
            <span className="font-medium">{it.title}</span>
            {it.completion_criteria && <span className="text-sm text-gray-600"> — {it.completion_criteria}</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Tasks({project}){
  const [items,setItems]=useState([]);
  const load=()=> api.get(`/projects/${project.id}/tasks`).then(r=>setItems(r.data));
  useEffect(()=>{load();},[project.id]);
  const add=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const payload=Object.fromEntries(fd.entries());
    await api.post(`/projects/${project.id}/tasks`, payload); e.target.reset(); load();
  };
  return (
    <Card title="Schedule (Tasks)" actions={null}>
      <form onSubmit={add} className="grid md:grid-cols-7 gap-2 bg-gray-50 p-3 rounded-xl">
        <input name="assignee" placeholder="Assignee" className="border rounded px-2 py-1"/>
        <input name="effort_days" placeholder="Effort (days)" className="border rounded px-2 py-1"/>
        <input name="duration_days" placeholder="Duration (days)" className="border rounded px-2 py-1"/>
        <input type="date" name="start_date" className="border rounded px-2 py-1"/>
        <input type="date" name="end_date" className="border rounded px-2 py-1"/>
        <input name="status" placeholder="Status" className="border rounded px-2 py-1"/>
        <button className="bg-black text-white rounded px-3 py-1">Add Task</button>
      </form>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="text-left"><th className="p-2">Assignee</th><th className="p-2">Effort</th><th className="p-2">Duration</th><th className="p-2">Start</th><th className="p-2">End</th><th className="p-2">Status</th></tr></thead>
          <tbody>
            {items.map(t=> (
              <tr key={t.id} className="border-t">
                <td className="p-2">{t.assignee||'—'}</td>
                <td className="p-2">{t.effort_days||'—'}</td>
                <td className="p-2">{t.duration_days||'—'}</td>
                <td className="p-2">{t.start_date||'—'}</td>
                <td className="p-2">{t.end_date||'—'}</td>
                <td className="p-2">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CommsPlan({project}){
  return (
    <Card title="Communications Plan" actions={null}>
      <p className="text-sm text-gray-600">Map stakeholders to channels & frequency (e.g., Sponsor → weekly 15‑min; Team → 30‑min standup; Board → milestone chart).</p>
      <p className="text-sm text-gray-600">(Optional API can be added similar to Stakeholders at `/api/projects/:id/comms`.)</p>
    </Card>
  );
}

function Changes({project}){
  const [items,setItems]=useState([]);
  const load=()=> api.get(`/projects/${project.id}/changes`).then(r=>setItems(r.data));
  useEffect(()=>{load();},[project.id]);
  const add=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.target); const payload=Object.fromEntries(fd.entries());
    payload.impact = payload.impact ? JSON.parse(payload.impact) : null;
    await api.post(`/projects/${project.id}/changes`,payload); e.target.reset(); load();
  };
  return (
    <Card title="Change Requests" actions={null}>
      <form onSubmit={add} className="grid md:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl">
        <input name="title" placeholder="Title" className="border rounded px-2 py-1 md:col-span-2"/>
        <input name="requested_by" placeholder="Requested by" className="border rounded px-2 py-1"/>
        <input name="type" placeholder="Type (scope/time/cost)" className="border rounded px-2 py-1"/>
        <textarea name="impact" placeholder='Impact JSON e.g. {"scope":"-feature","time_days":5,"cost":1200}' className="border rounded px-2 py-1 md:col-span-5 font-mono text-xs"></textarea>
        <textarea name="description" placeholder="Description" className="border rounded px-2 py-1 md:col-span-5"></textarea>
        <button className="bg-black text-white rounded px-3 py-1 w-max">Submit Change</button>
      </form>
      <ul className="divide-y">
        {items.map(c=> (
          <li key={c.id} className="py-2">
            <div className="font-medium">{c.title} <span className="text-xs text-gray-500">({c.type})</span></div>
            <div className="text-xs text-gray-600">Decision: {c.decision}</div>
            <pre className="bg-gray-50 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(c.impact,null,2)}</pre>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Meetings({project}){
  const [items,setItems]=useState([]);
  const load=()=> api.get(`/projects/${project.id}/meetings`).then(r=>setItems(r.data));
  useEffect(()=>{load();},[project.id]);
  const add=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.target); const payload=Object.fromEntries(fd.entries());
    payload.attendees = payload.attendees ? payload.attendees.split(',').map(s=>s.trim()) : [];
    await api.post(`/projects/${project.id}/meetings`,payload); e.target.reset(); load();
  };
  return (
    <Card title="Meetings & Minutes" actions={null}>
      <form onSubmit={add} className="grid md:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl">
        <input name="type" placeholder="type (status/sponsor/etc)" className="border rounded px-2 py-1"/>
        <input type="datetime-local" name="scheduled_at" className="border rounded px-2 py-1"/>
        <input name="duration_mins" placeholder="duration (min)" className="border rounded px-2 py-1"/>
        <input name="attendees" placeholder="attendees (comma‑sep)" className="border rounded px-2 py-1 md:col-span-2"/>
        <textarea name="agenda" placeholder="Agenda" className="border rounded px-2 py-1 md:col-span-5"/>
        <button className="bg-black text-white rounded px-3 py-1 w-max">Add Meeting</button>
      </form>
      <ul className="divide-y">
        {items.map(m=> (
          <li key={m.id} className="py-2">
            <div className="font-medium">{m.type} — {dayjs(m.scheduled_at).format('YYYY-MM-DD HH:mm')}</div>
            <div className="text-xs text-gray-600">{(m.attendees||[]).join(', ')}</div>
            {m.agenda && <pre className="bg-gray-50 rounded p-2 text-xs overflow-x-auto">{m.agenda}</pre>}
            {m.minutes && <pre className="bg-gray-50 rounded p-2 text-xs overflow-x-auto">{m.minutes}</pre>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Lessons({project}){
  const [items,setItems]=useState([]);
  const load=()=> api.get(`/projects/${project.id}/lessons`).then(r=>setItems(r.data));
  useEffect(()=>{load();},[project.id]);
  const add=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.target); const payload=Object.fromEntries(fd.entries());
    await api.post(`/projects/${project.id}/lessons`,payload); e.target.reset(); load();
  };
  return (
    <Card title="Lessons Learned" actions={null}>
      <form onSubmit={add} className="grid md:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl">
        <input name="category" placeholder="category (scope/planning/risk/team/comms/other)" className="border rounded px-2 py-1 md:col-span-2"/>
        <textarea name="went_well" placeholder="What went well" className="border rounded px-2 py-1 md:col-span-5"/>
        <textarea name="improve" placeholder="What to improve" className="border rounded px-2 py-1 md:col-span-5"/>
        <textarea name="actions" placeholder="Actions" className="border rounded px-2 py-1 md:col-span-5"/>
        <button className="bg-black text-white rounded px-3 py-1 w-max">Add Lesson</button>
      </form>
      <ul className="divide-y">
        {items.map(l=> (
          <li key={l.id} className="py-2">
            <div className="font-medium">{l.category}</div>
            <div className="text-sm"><span className="font-medium">Went well:</span> {l.went_well}</div>
            <div className="text-sm"><span className="font-medium">Improve:</span> {l.improve}</div>
            {l.actions && <div className="text-sm"><span className="font-medium">Actions:</span> {l.actions}</div>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
