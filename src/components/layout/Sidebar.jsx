import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLeaf, faHouse, faChartLine, faUsers, faClipboardList,
    faRobot, faVirus, faSeedling
} from '@fortawesome/free-solid-svg-icons';

const topNavItems = [
    { id: 'home', label: 'Home Dashboard', icon: faHouse },
];

const featureNavItems = [
    { id: 'market', label: 'Market Intelligence', icon: faChartLine },
    { id: 'community', label: 'Community', icon: faUsers },
    { id: 'dev-planner', label: 'Farm Planner', icon: faClipboardList },
    { id: 'ai-assistant', label: 'AI Assistant', icon: faRobot },
    { id: 'dashboard', label: 'Outbreak Analysis', icon: faVirus },
    { id: 'crop-planning', label: 'Crop Planning', icon: faSeedling },
    // { id: 'roi-calculator', label: 'ROI Calculator', icon: faCalculator },
    // { id: 'econ-dashboard', label: 'Econ Dashboard', icon: faChartPie },
];

export default function Sidebar({ activeNav, onNavChange }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon"><FontAwesomeIcon icon={faLeaf} /></div>
                <h1>LeafNetwork</h1>
                <p>Multi-Agent Platform</p>
            </div>

            <nav className="sidebar-nav">
                {topNavItems.map((item) => (
                    <div
                        key={item.id}
                        className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                        onClick={() => onNavChange(item.id)}
                    >
                        <span className="nav-icon"><FontAwesomeIcon icon={item.icon} /></span>
                        <span>{item.label}</span>
                    </div>
                ))}

                <div className="sidebar-section-label">Features</div>

                {featureNavItems.map((item) => (
                    <div
                        key={item.id}
                        className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                        onClick={() => onNavChange(item.id)}
                    >
                        <span className="nav-icon"><FontAwesomeIcon icon={item.icon} /></span>
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-status">
                    <span className="status-dot"></span>
                    <span>All Systems Operational</span>
                </div>
            </div>
        </aside>
    );
}
