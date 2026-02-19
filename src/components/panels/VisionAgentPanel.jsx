import { useCallback, useRef, useState } from 'react';
import AgentCard from '../ui/AgentCard';
import StatusBadge from '../ui/StatusBadge';
import { useAppState } from '../../context/AppContext';
import { analyzeImage } from '../../services/api';

export default function VisionAgentPanel() {
    const { state, dispatch } = useAppState();
    const { visionResult: data, visionLoading: loading, visionError: error } = state;
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [fileName, setFileName] = useState('');
    const [preview, setPreview] = useState(null);

    const handleFile = useCallback(async (file) => {
        if (!file || !file.type.startsWith('image/')) return;

        // Create preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);

        setFileName(file.name);
        dispatch({ type: 'VISION_LOADING' });
        try {
            const result = await analyzeImage(file);
            dispatch({ type: 'VISION_SUCCESS', payload: result });
        } catch (err) {
            dispatch({ type: 'VISION_ERROR', payload: err.message });
        }
    }, [dispatch]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    return (
        <AgentCard
            title="Vision Detection Agent"
            subtitle="CNN-based leaf disease classifier"
            icon="👁️"
            accentColor="var(--accent-cyan)"
            statusBadge={data ? <StatusBadge status="Verified" /> : <StatusBadge status="Pending" />}
        >
            {/* Upload area */}
            <div
                className={`upload-placeholder ${dragOver ? 'upload-dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: preview ? '260px' : '200px',
                    padding: preview ? '0' : 'var(--space-lg)'
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files[0])}
                />

                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Leaf Preview"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />
                        {loading && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}>
                                <span className="spinner"></span>
                                <span className="upload-text">Analyzing image…</span>
                            </div>
                        )}
                        {!loading && (
                            <div style={{
                                position: 'absolute',
                                bottom: '12px',
                                right: '12px',
                                background: 'rgba(0,0,0,0.7)',
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 'var(--font-size-xs)',
                                color: '#fff',
                                pointerEvents: 'none'
                            }}>
                                Click to change image
                            </div>
                        )}
                    </>
                ) : (
                    loading ? (
                        <>
                            <span className="spinner"></span>
                            <span className="upload-text">Analyzing image…</span>
                        </>
                    ) : (
                        <>
                            <span className="upload-icon">📷</span>
                            <span className="upload-text">
                                {fileName ? `Uploaded: ${fileName}` : 'Upload leaf image for analysis'}
                            </span>
                            <span className="upload-hint">Drag & drop or click to browse · JPG, PNG up to 10MB</span>
                        </>
                    )
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="error-alert">⚠️ {error}</div>
            )}

            {/* Results */}
            {data && (
                <div>
                    <div className="field-row">
                        <span className="field-label">Disease Detected</span>
                        <span className="field-value">{data.disease_name}</span>
                    </div>
                    <div className="field-row">
                        <span className="field-label">Confidence Score</span>
                        <span className="field-value" style={{ color: 'var(--accent-green)' }}>
                            {data.confidence}%
                        </span>
                    </div>
                    <div className="field-row">
                        <span className="field-label">Severity Stage</span>
                        <span className="field-value" style={{ color: 'var(--accent-amber)' }}>
                            {data.severity_stage}
                        </span>
                    </div>
                    <div className="field-row">
                        <span className="field-label">Analyzed At</span>
                        <span className="field-value">{data.analyzed_at}</span>
                    </div>

                    {/* Top predictions */}
                    {data.top_predictions && data.top_predictions.length > 1 && (
                        <div className="prediction-list">
                            <div className="sidebar-section-label" style={{ padding: '12px 0 6px' }}>
                                All Predictions
                            </div>
                            {data.top_predictions.map((p, i) => (
                                <div key={i} className="field-row">
                                    <span className="field-label">{p.label}</span>
                                    <span className="field-value" style={{
                                        color: i === 0 ? 'var(--accent-green)' : 'var(--text-secondary)'
                                    }}>
                                        {p.confidence}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Empty state (only if no data and no preview) */}
            {!data && !loading && !error && !preview && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', padding: 'var(--space-md) 0' }}>
                    Upload a plant leaf image to begin disease analysis
                </div>
            )}
        </AgentCard>
    );
}
