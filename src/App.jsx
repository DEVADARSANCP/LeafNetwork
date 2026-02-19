import { useState, useMemo } from 'react';
import { useAppState } from './context/AppContext';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import MainContent from './components/layout/MainContent';
import LocationBar from './components/ui/LocationBar';
import VisionAgentPanel from './components/panels/VisionAgentPanel';
import ClimateAgentPanel from './components/panels/ClimateAgentPanel';
import SatelliteAgentPanel from './components/panels/SatelliteAgentPanel';
import OrchestrationPanel from './components/panels/OrchestrationPanel';
import RecommendationPanel from './components/panels/RecommendationPanel';
import HomeDashboard from './components/panels/HomeDashboard';
import MarketIntelligence from './components/panels/MarketIntelligence';
import Onboarding from './components/panels/Onboarding';
import CropPlanResult, { generateCropPlan } from './components/panels/CropPlanResult';
import CommunityPanel from './components/panels/CommunityPanel';
import AIAssistantPanel from './components/panels/AIAssistantPanel';
import DevPlannerPanel from './components/panels/DevPlannerPanel';

const pageConfig = {
  home: { title: 'Home Dashboard', subtitle: 'Welcome to AgriIntel — your smart farming command center' },
  market: { title: 'Market Intelligence', subtitle: 'Real-time crop pricing & market trend analysis' },
  community: { title: 'Community', subtitle: 'Connect with farmers, experts & agronomists' },
  'dev-planner': { title: 'Dev Planner', subtitle: 'Plan and track your development cycles' },
  'ai-assistant': { title: 'AI Assistant', subtitle: 'Chat with your intelligent farming advisor' },
  dashboard: { title: 'Outbreak Analysis', subtitle: 'Real-time multi-agent disease detection & monitoring' },
  'crop-planning': { title: 'Crop Planning', subtitle: 'Smart crop rotation & seasonal planning' },
  'roi-calculator': { title: 'ROI Calculator', subtitle: 'Estimate returns on your farming investments' },
  'econ-dashboard': { title: 'Econ Dashboard', subtitle: 'Economic indicators & farm financial health' },
};

function ComingSoonView({ title }) {
  return (
    <div className="coming-soon-wrapper">
      <div className="coming-soon-card">
        <div className="coming-soon-icon">🚧</div>
        <h2>{title}</h2>
        <p>This feature is currently under development and will be available soon.</p>
        <div className="coming-soon-badge">Coming Soon</div>
      </div>
    </div>
  );
}

function OutbreakAnalysisView() {
  return (
    <>
      <LocationBar />
      <div className="panel-grid">
        <VisionAgentPanel />
        <ClimateAgentPanel />
        <SatelliteAgentPanel />
      </div>
      <div className="panel-grid">
        <OrchestrationPanel />
      </div>
      <div className="panel-grid">
        <RecommendationPanel />
      </div>
    </>
  );
}

function CropPlanningView() {
  const { state } = useAppState();
  const plan = useMemo(
    () => generateCropPlan(state.onboardingData),
    [state.onboardingData]
  );
  // Render inside main content area (no fullscreen, no CTA)
  return <CropPlanResult plan={plan} embedded />;
}

function AppContent() {
  const [activeNav, setActiveNav] = useState('home');
  const config = pageConfig[activeNav];

  return (
    <div className="app-layout">
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
      <MainContent title={config.title} subtitle={config.subtitle}>
        {activeNav === 'home'
          ? <HomeDashboard onNavigate={setActiveNav} />
          : activeNav === 'dashboard'
            ? <OutbreakAnalysisView />
            : activeNav === 'market'
              ? <MarketIntelligence />
              : activeNav === 'crop-planning'
                ? <CropPlanningView />
                : activeNav === 'community'
                  ? <CommunityPanel />
                  : activeNav === 'ai-assistant'
                    ? <AIAssistantPanel />
                    : activeNav === 'dev-planner'
                      ? <DevPlannerPanel />
                      : <ComingSoonView title={config.title} />
        }
      </MainContent>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppGate />
    </AppProvider>
  );
}

function AppGate() {
  const { state, dispatch } = useAppState();

  // Step 1: Onboarding not done → show wizard
  if (!state.onboardingComplete) {
    return (
      <Onboarding
        onComplete={(data) => dispatch({ type: 'COMPLETE_ONBOARDING', payload: data })}
      />
    );
  }

  // Step 2: Onboarding done but crop plan not yet seen → show crop plan
  if (!state.cropPlanSeen) {
    const plan = generateCropPlan(state.onboardingData);
    return (
      <CropPlanResult
        plan={plan}
        onContinue={() => dispatch({ type: 'DISMISS_CROP_PLAN' })}
      />
    );
  }

  // Step 3: All set → main app
  return <AppContent />;
}
