import { useEffect } from 'react';
import AgentCard from '../ui/AgentCard';
import StatusBadge from '../ui/StatusBadge';
import MetricBadge from '../ui/MetricBadge';
import ProgressBar from '../ui/ProgressBar';
import { useAppState } from '../../context/AppContext';
import { getSatelliteHealth } from '../../services/api';

export default function SatelliteAgentPanel() {
    const { state, dispatch } = useAppState();
    const { satelliteResult: data, satelliteLoading: loading, satelliteError: error, location } = state;

    // Auto-fetch when location changes
    useEffect(() => {
        let cancelled = false;
        async function fetchSatellite() {
            dispatch({ type: 'SATELLITE_LOADING' });
            try {
                const result = await getSatelliteHealth(location.lat, location.lon);
                if (!cancelled) dispatch({ type: 'SATELLITE_SUCCESS', payload: result });
            } catch (err) {
                if (!cancelled) dispatch({ type: 'SATELLITE_ERROR', payload: err.message });
            }
        }
        fetchSatellite();
        return () => { cancelled = true; };
    }, [location.lat, location.lon, dispatch]);

    const getStressColor = (level) => {
        switch (level) {
            case 'Severe': return 'var(--accent-red)';
            case 'High': return 'var(--accent-red)';
            case 'Moderate': return 'var(--accent-amber)';
            case 'Low': return 'var(--accent-green)';
            default: return 'var(--text-primary)';
        }
    };

    const getNdviColor = (score) => {
        if (score >= 0.6) return 'green';
        if (score >= 0.3) return 'amber';
        return 'red';
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'Improving': return '↗';
            case 'Declining': return '↘';
            default: return '→';
        }
    };

    return (
        <AgentCard
            title="Satellite Health Agent"
            subtitle={`Vegetation analysis · ${state.locationName || `${location.lat}, ${location.lon}`}`}
            icon="🛰️"
            accentColor="var(--accent-green)"
            statusBadge={
                loading ? <StatusBadge status="Pending" /> :
                    error ? <StatusBadge status="Conflict" /> :
                        data ? <StatusBadge status="Verified" /> :
                            <StatusBadge status="Pending" />
            }
        >
            {loading && (
                <div className="loading-state">
                    <span className="spinner"></span>
                    <span>Fetching vegetation data from NASA POWER…</span>
                </div>
            )}

            {error && <div className="error-alert">⚠️ {error}</div>}

            {data && !loading && (
                <>
                    <div className="metric-row">
                        <MetricBadge
                            label="NDVI Score"
                            value={data.ndvi_score}
                            color={getStressColor(data.vegetation_stress)}
                        />
                        <MetricBadge
                            label="Vegetation Stress"
                            value={data.vegetation_stress}
                            color={getStressColor(data.vegetation_stress)}
                        />
                        <MetricBadge
                            label="Health Trend"
                            value={`${getTrendIcon(data.health_trend)} ${data.health_trend}`}
                            color={data.health_trend === 'Declining' ? 'var(--accent-red)' :
                                data.health_trend === 'Improving' ? 'var(--accent-green)' :
                                    'var(--accent-amber)'}
                        />
                    </div>

                    <ProgressBar
                        label="Vegetation Health Index"
                        value={data.ndvi_score * 100}
                        colorClass={getNdviColor(data.ndvi_score)}
                    />

                    <div className="map-placeholder" style={{ padding: 0, overflow: 'hidden', minHeight: '250px', position: 'relative' }}>
                        <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0, display: 'block', minHeight: '250px' }}
                            src={`https://maps.google.com/maps?q=${location.lat},${location.lon}&t=k&z=15&ie=UTF8&iwloc=&output=embed`}
                            allowFullScreen
                        ></iframe>
                        <div style={{
                            position: 'absolute',
                            bottom: '12px',
                            left: '12px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <span className="map-icon" style={{ fontSize: '14px' }}>🗺️</span>
                            <span className="map-text" style={{ color: '#fff', fontSize: '11px', fontWeight: 500 }}>
                                Satellite viewport — {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E
                            </span>
                        </div>
                    </div>

                    <div className="field-row">
                        <span className="field-label">Data Source</span>
                        <span className="field-value">{data.data_source}</span>
                    </div>
                    <div className="field-row">
                        <span className="field-label">Coverage Period</span>
                        <span className="field-value">{data.coverage_period}</span>
                    </div>
                    <div className="field-row">
                        <span className="field-label">Last Updated</span>
                        <span className="field-value">{data.last_updated}</span>
                    </div>
                </>
            )}
        </AgentCard>
    );
}
