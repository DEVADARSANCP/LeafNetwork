import { useState, useEffect, useCallback } from 'react';

// ── Unique ID generator ──
let _id = Date.now();
const uid = () => `dp-${_id++}`;

// ── Default crop task templates ──
const CROP_TEMPLATES = [
    {
        name: '🌾 Rice (Kharif)',
        phases: [
            { title: 'Nursery Preparation', duration: '15 days', tasks: ['Seed selection & treatment', 'Nursery bed prep', 'Sowing seeds in nursery'] },
            { title: 'Land Preparation', duration: '7 days', tasks: ['Ploughing & puddling', 'Levelling the field', 'Apply basal fertilizer'] },
            { title: 'Transplanting', duration: '5 days', tasks: ['Uproot seedlings', 'Transplant to main field', 'Maintain water level'] },
            { title: 'Growth & Care', duration: '60 days', tasks: ['Weed management', 'Top-dress fertilizer', 'Pest & disease monitoring', 'Water management'] },
            { title: 'Harvesting', duration: '10 days', tasks: ['Drain field before harvest', 'Harvest at maturity', 'Threshing & drying'] },
        ],
    },
    {
        name: '🍌 Banana',
        phases: [
            { title: 'Land Preparation', duration: '10 days', tasks: ['Deep ploughing', 'Pit digging (45×45×45 cm)', 'Fill pits with FYM + topsoil'] },
            { title: 'Planting', duration: '3 days', tasks: ['Select healthy suckers', 'Plant in pits', 'Irrigate immediately'] },
            { title: 'Vegetative Growth', duration: '120 days', tasks: ['Regular irrigation', 'Fertilizer schedule', 'De-suckering', 'Mulching'] },
            { title: 'Flowering & Fruiting', duration: '90 days', tasks: ['Prop support for bunches', 'Bunch cover (if needed)', 'Pest monitoring'] },
            { title: 'Harvest', duration: '7 days', tasks: ['Harvest at 75% maturity', 'Ripening chamber', 'Grade & pack'] },
        ],
    },
    {
        name: '🥔 Potato (Rabi)',
        phases: [
            { title: 'Field Preparation', duration: '7 days', tasks: ['Fine tilth ploughing', 'Ridge / furrow formation', 'Apply FYM'] },
            { title: 'Sowing', duration: '3 days', tasks: ['Seed tuber treatment', 'Plant tubers 5-7 cm deep', 'Light irrigation'] },
            { title: 'Growth Management', duration: '70 days', tasks: ['Earthing up (2 rounds)', 'Irrigation schedule', 'Fertilizer top dress', 'Late blight spray'] },
            { title: 'Harvest & Storage', duration: '10 days', tasks: ['Haulm cutting 10 days before harvest', 'Dig tubers carefully', 'Cure & cold-store'] },
        ],
    },
    {
        name: '📋 Blank Plan',
        phases: [
            { title: 'Phase 1', duration: '—', tasks: ['Task 1'] },
        ],
    },
];

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', color: 'var(--accent-amber)' },
    { value: 'in-progress', label: 'In Progress', color: 'var(--accent-blue)' },
    { value: 'done', label: 'Done', color: 'var(--accent-green)' },
    { value: 'skipped', label: 'Skipped', color: 'var(--text-muted)' },
];

const STORAGE_KEY = 'agriintel_dev_planner';

// ── Helpers ──
function loadPlans() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}
function savePlans(plans) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

function buildPlanFromTemplate(template) {
    return {
        id: uid(),
        name: template.name.replace(/^[^\s]+\s/, ''),  // strip emoji
        emoji: template.name.split(' ')[0],
        createdAt: new Date().toISOString(),
        phases: template.phases.map(ph => ({
            id: uid(),
            title: ph.title,
            duration: ph.duration,
            tasks: ph.tasks.map(t => ({ id: uid(), text: t, status: 'pending', notes: '' })),
        })),
    };
}

function calcProgress(plan) {
    const all = plan.phases.flatMap(p => p.tasks);
    if (all.length === 0) return 0;
    const done = all.filter(t => t.status === 'done').length;
    return Math.round((done / all.length) * 100);
}

// ── Components ──

function ProgressRing({ pct, size = 48, stroke = 5 }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const off = circ - (pct / 100) * circ;
    const color = pct >= 80 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-blue)' : 'var(--accent-amber)';

    return (
        <svg width={size} height={size} className="dp-ring">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-input)" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
                strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off}
                strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
                fill="var(--text-primary)" fontSize="0.7rem" fontWeight="700">{pct}%</text>
        </svg>
    );
}

function StatusDot({ status }) {
    const s = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
    return <span className="dp-status-dot" style={{ background: s.color }} title={s.label} />;
}

function TaskRow({ task, onUpdate, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(task.text);

    const commitText = () => {
        setEditing(false);
        if (text.trim() && text !== task.text) onUpdate({ ...task, text: text.trim() });
    };

    return (
        <div className={`dp-task-row ${task.status === 'done' ? 'dp-task-done' : ''}`}>
            <StatusDot status={task.status} />
            <div className="dp-task-body">
                {editing ? (
                    <input className="dp-inline-input" autoFocus value={text}
                        onChange={e => setText(e.target.value)}
                        onBlur={commitText} onKeyDown={e => e.key === 'Enter' && commitText()} />
                ) : (
                    <span className="dp-task-text" onDoubleClick={() => setEditing(true)}>{task.text}</span>
                )}
            </div>
            <select className="dp-status-select" value={task.status}
                onChange={e => onUpdate({ ...task, status: e.target.value })}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className="dp-icon-btn dp-delete-btn" onClick={onDelete} title="Remove task">✕</button>
        </div>
    );
}

function PhaseCard({ phase, onUpdate, onDelete }) {
    const [collapsed, setCollapsed] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(phase.title);
    const doneTasks = phase.tasks.filter(t => t.status === 'done').length;

    const commitTitle = () => {
        setEditingTitle(false);
        if (titleDraft.trim()) onUpdate({ ...phase, title: titleDraft.trim() });
    };

    const updateTask = (updated) => {
        onUpdate({ ...phase, tasks: phase.tasks.map(t => t.id === updated.id ? updated : t) });
    };
    const deleteTask = (id) => {
        onUpdate({ ...phase, tasks: phase.tasks.filter(t => t.id !== id) });
    };
    const addTask = () => {
        onUpdate({ ...phase, tasks: [...phase.tasks, { id: uid(), text: 'New task', status: 'pending', notes: '' }] });
    };

    return (
        <div className="dp-phase-card">
            <div className="dp-phase-header" onClick={() => setCollapsed(!collapsed)}>
                <div className="dp-phase-left">
                    <span className={`dp-chevron ${collapsed ? '' : 'dp-chevron-open'}`}>▶</span>
                    {editingTitle ? (
                        <input className="dp-inline-input dp-phase-title-input" autoFocus value={titleDraft}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setTitleDraft(e.target.value)}
                            onBlur={commitTitle} onKeyDown={e => e.key === 'Enter' && commitTitle()} />
                    ) : (
                        <span className="dp-phase-title" onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); }}>
                            {phase.title}
                        </span>
                    )}
                    <span className="dp-phase-duration">{phase.duration}</span>
                </div>
                <div className="dp-phase-right">
                    <span className="dp-phase-count">{doneTasks}/{phase.tasks.length}</span>
                    <button className="dp-icon-btn dp-delete-btn" onClick={e => { e.stopPropagation(); onDelete(); }}
                        title="Delete phase">🗑</button>
                </div>
            </div>
            {!collapsed && (
                <div className="dp-phase-body">
                    {phase.tasks.map(t => (
                        <TaskRow key={t.id} task={t} onUpdate={updateTask} onDelete={() => deleteTask(t.id)} />
                    ))}
                    <button className="dp-add-task-btn" onClick={addTask}>+ Add Task</button>
                </div>
            )}
        </div>
    );
}

// ── Main Panel ──
export default function DevPlannerPanel() {
    const [plans, setPlans] = useState(() => loadPlans());
    const [activePlanId, setActivePlanId] = useState(null);
    const [showTemplates, setShowTemplates] = useState(false);

    // Persist on change
    useEffect(() => { savePlans(plans); }, [plans]);

    const activePlan = plans.find(p => p.id === activePlanId) || null;

    const createPlan = useCallback((template) => {
        const plan = buildPlanFromTemplate(template);
        setPlans(prev => [plan, ...prev]);
        setActivePlanId(plan.id);
        setShowTemplates(false);
    }, []);

    const deletePlan = useCallback((id) => {
        setPlans(prev => prev.filter(p => p.id !== id));
        if (activePlanId === id) setActivePlanId(null);
    }, [activePlanId]);

    const updatePhase = (phaseId, updated) => {
        setPlans(prev => prev.map(p => {
            if (p.id !== activePlanId) return p;
            return { ...p, phases: p.phases.map(ph => ph.id === phaseId ? updated : ph) };
        }));
    };

    const deletePhase = (phaseId) => {
        setPlans(prev => prev.map(p => {
            if (p.id !== activePlanId) return p;
            return { ...p, phases: p.phases.filter(ph => ph.id !== phaseId) };
        }));
    };

    const addPhase = () => {
        setPlans(prev => prev.map(p => {
            if (p.id !== activePlanId) return p;
            return {
                ...p, phases: [...p.phases, {
                    id: uid(), title: 'New Phase', duration: '—',
                    tasks: [{ id: uid(), text: 'New task', status: 'pending', notes: '' }],
                }]
            };
        }));
    };

    // ── Template Picker ──
    if (showTemplates) {
        return (
            <div className="dp-page">
                <div className="dp-header">
                    <div className="dp-header-left">
                        <button className="dp-back-btn" onClick={() => setShowTemplates(false)}>← Back</button>
                        <h1 className="dp-title">Choose a Crop Template</h1>
                        <p className="dp-subtitle">Start with a pre-built plan or create a blank one</p>
                    </div>
                </div>
                <div className="dp-templates-grid">
                    {CROP_TEMPLATES.map((t, i) => (
                        <div className="dp-template-card" key={i} onClick={() => createPlan(t)}>
                            <div className="dp-template-emoji">{t.name.split(' ')[0]}</div>
                            <div className="dp-template-name">{t.name.replace(/^[^\s]+\s/, '')}</div>
                            <div className="dp-template-meta">{t.phases.length} phases · {t.phases.reduce((s, p) => s + p.tasks.length, 0)} tasks</div>
                            <div className="dp-template-action">Use Template ›</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ── Active plan detail ──
    if (activePlan) {
        const pct = calcProgress(activePlan);
        const totalTasks = activePlan.phases.reduce((s, p) => s + p.tasks.length, 0);
        const doneTasks = activePlan.phases.reduce((s, p) => s + p.tasks.filter(t => t.status === 'done').length, 0);
        const inProgress = activePlan.phases.reduce((s, p) => s + p.tasks.filter(t => t.status === 'in-progress').length, 0);

        return (
            <div className="dp-page">
                <div className="dp-header">
                    <div className="dp-header-left">
                        <button className="dp-back-btn" onClick={() => setActivePlanId(null)}>← All Plans</button>
                        <h1 className="dp-title">{activePlan.emoji} {activePlan.name}</h1>
                        <p className="dp-subtitle">Created {new Date(activePlan.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="dp-header-right">
                        <ProgressRing pct={pct} />
                    </div>
                </div>

                {/* Summary strip */}
                <div className="dp-summary-strip">
                    <div className="dp-summary-item">
                        <span className="dp-summary-val">{activePlan.phases.length}</span>
                        <span className="dp-summary-lbl">Phases</span>
                    </div>
                    <div className="dp-summary-item">
                        <span className="dp-summary-val">{totalTasks}</span>
                        <span className="dp-summary-lbl">Tasks</span>
                    </div>
                    <div className="dp-summary-item">
                        <span className="dp-summary-val" style={{ color: 'var(--accent-green)' }}>{doneTasks}</span>
                        <span className="dp-summary-lbl">Done</span>
                    </div>
                    <div className="dp-summary-item">
                        <span className="dp-summary-val" style={{ color: 'var(--accent-blue)' }}>{inProgress}</span>
                        <span className="dp-summary-lbl">Active</span>
                    </div>
                </div>

                {/* Phases */}
                <div className="dp-phases-list">
                    {activePlan.phases.map(ph => (
                        <PhaseCard key={ph.id} phase={ph}
                            onUpdate={(updated) => updatePhase(ph.id, updated)}
                            onDelete={() => deletePhase(ph.id)} />
                    ))}
                    <button className="dp-add-phase-btn" onClick={addPhase}>+ Add Phase</button>
                </div>
            </div>
        );
    }

    // ── Plans list (home) ──
    return (
        <div className="dp-page">
            <div className="dp-header">
                <div className="dp-header-left">
                    <div className="dp-header-badge"><span className="dp-dot" /> Development Planner</div>
                    <h1 className="dp-title">Crop Dev Plans</h1>
                    <p className="dp-subtitle">Plan, track, and manage your crop development cycles</p>
                </div>
                <div className="dp-header-right">
                    <button className="btn btn-primary" onClick={() => setShowTemplates(true)}>+ New Plan</button>
                </div>
            </div>

            {plans.length === 0 ? (
                <div className="dp-empty-state">
                    <div className="dp-empty-icon">📖</div>
                    <h3>No development plans yet</h3>
                    <p>Create your first crop plan to track growth phases, tasks, and progress.</p>
                    <button className="btn btn-primary" onClick={() => setShowTemplates(true)}>Create First Plan ›</button>
                </div>
            ) : (
                <div className="dp-plans-grid">
                    {plans.map(p => {
                        const pct = calcProgress(p);
                        const totalT = p.phases.reduce((s, ph) => s + ph.tasks.length, 0);
                        const doneT = p.phases.reduce((s, ph) => s + ph.tasks.filter(t => t.status === 'done').length, 0);
                        return (
                            <div className="dp-plan-card" key={p.id} onClick={() => setActivePlanId(p.id)}>
                                <div className="dp-plan-card-top">
                                    <span className="dp-plan-emoji">{p.emoji}</span>
                                    <ProgressRing pct={pct} size={40} stroke={4} />
                                </div>
                                <div className="dp-plan-card-name">{p.name}</div>
                                <div className="dp-plan-card-meta">{p.phases.length} phases · {doneT}/{totalT} tasks done</div>
                                <div className="dp-plan-card-date">
                                    {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </div>
                                <div className="dp-plan-card-bottom">
                                    <span className="dp-plan-open">Open ›</span>
                                    <button className="dp-icon-btn dp-delete-btn"
                                        onClick={e => { e.stopPropagation(); deletePlan(p.id); }} title="Delete plan">🗑</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
