import { useState } from 'react';

// ── Mock data ──
const CATEGORIES = [
    { id: 'all', label: 'All', icon: '🌾', color: '#10b981' },
    { id: 'crop-care', label: 'Crop Care', icon: '🌱', color: '#22c55e' },
    { id: 'disease', label: 'Disease Alerts', icon: '🦠', color: '#ef4444' },
    { id: 'market', label: 'Market Talks', icon: '💰', color: '#f59e0b' },
    { id: 'machinery', label: 'Machinery', icon: '🚜', color: '#3b82f6' },
    { id: 'climate', label: 'Climate', icon: '🌤', color: '#06b6d4' },
];

const MOCK_POSTS = [
    {
        id: 1, category: 'market', type: 'discussion',
        author: 'Ramesh Patel', location: 'Nashik, MH', avatar: '👨‍🌾',
        time: '2h ago', votes: 248,
        title: 'Onion prices expected to spike in April — storage tips?',
        body: "I've been tracking mandi prices for 3 seasons. Based on what I see, April looks like a great time to sell stored onion. Anyone else holding stock? What storage techniques are you using to maintain quality?",
        tags: ['#onion', '#mandi', '#storage'],
        comments: 34, rating: 0,
    },
    {
        id: 2, category: 'disease', type: 'review',
        author: 'Sunita Devi', location: 'Coimbatore, TN', avatar: '👩‍🌾',
        time: '5h ago', votes: 193,
        title: 'Early Blight spreading in Tomato crops — Thanjavur region',
        body: 'Spotted early blight on my tomato plants 3 days ago. Copper hydroxide spray at 2g/L worked well. Applying again in 7 days. Other farmers in Thanjavur should check their crops immediately — weather conditions are favorable for spread.',
        tags: ['#tomato', '#disease', '#alert', '#fungicide'],
        comments: 56, rating: 4,
    },
    {
        id: 3, category: 'crop-care', type: 'review',
        author: 'Vijay Kumar', location: 'Ludhiana, PB', avatar: '👨‍🌾',
        time: '1d ago', votes: 421,
        title: 'Drip irrigation cut my water usage by 40% — full breakdown',
        body: 'Installed drip system on 3 acres last Kharif. Water bill dropped 40%, yield increased 22%. Upfront cost was ₹85,000 but government subsidy covered 50%. ROI in 2 seasons. Happy to share detailed cost breakdown.',
        tags: ['#drip-irrigation', '#water', '#subsidy', '#ROI'],
        comments: 89, rating: 5,
    },
    {
        id: 4, category: 'machinery', type: 'discussion',
        author: 'Arun Sharma', location: 'Jaipur, RJ', avatar: '🧑‍🌾',
        time: '2d ago', votes: 167,
        title: 'Mahindra OJ 210 vs Sonalika DI 35 — which one for 5 acres?',
        body: "Planning to buy my first tractor. Budget is ₹6-7 lakhs. My land is mostly clay soil with some irrigation channels. Anyone using either of these models? Looking for real user reviews, not dealer talk.",
        tags: ['#tractor', '#mahindra', '#sonalika', '#review'],
        comments: 72, rating: 0,
    },
    {
        id: 5, category: 'climate', type: 'discussion',
        author: 'Meena Bai', location: 'Indore, MP', avatar: '👩‍🌾',
        time: '3d ago', votes: 135,
        title: 'Unseasonal rains damaged Rabi wheat — recovery strategies?',
        body: 'We got 40mm rain last week which was unexpected. My wheat is at grain-filling stage. Some lodging visible. Has anyone dealt with similar situation? Should I spray urea or wait for natural recovery?',
        tags: ['#wheat', '#rain', '#rabi', '#recovery'],
        comments: 41, rating: 0,
    },
    {
        id: 6, category: 'crop-care', type: 'review',
        author: 'Prakash Reddy', location: 'Guntur, AP', avatar: '👨‍🌾',
        time: '4d ago', votes: 298,
        title: 'Vermicompost doubled my chili yield — 2 season data',
        body: "Switched from DAP to vermicompost + neem cake mix on my chili farm. Season 1: yield up 35%. Season 2: yield up 110% from baseline. Soil health test shows dramatic improvement in organic carbon. Total cost actually went down by ₹4,000/acre.",
        tags: ['#vermicompost', '#organic', '#chili', '#yield'],
        comments: 63, rating: 5,
    },
];

const TOP_CONTRIBUTORS = [
    { name: 'Ramesh Patel', location: 'Nashik, MH', avatar: '👨‍🌾', posts: 47, helpful: 1240 },
    { name: 'Sunita Devi', location: 'Coimbatore, TN', avatar: '👩‍🌾', posts: 38, helpful: 980 },
    { name: 'Vijay Kumar', location: 'Ludhiana, PB', avatar: '👨‍🌾', posts: 52, helpful: 1560 },
    { name: 'Prakash Reddy', location: 'Guntur, AP', avatar: '👨‍🌾', posts: 31, helpful: 870 },
];

const FARMER_PROFILE = {
    name: 'Aman ',
    location: 'Kottayam , Kerala',
    avatar: '🧑‍🌾',
    joined: 'Feb 2026',
    crops: ['Wheat'],
    stats: { posts: 12, reviews: 8, helpful: 156 },
};

function StarRating({ rating, interactive = false, onChange }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="cm-stars">
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    className={`cm-star ${star <= (hover || rating) ? 'cm-star--filled' : ''}`}
                    onClick={() => interactive && onChange?.(star)}
                    onMouseEnter={() => interactive && setHover(star)}
                    onMouseLeave={() => interactive && setHover(0)}
                    style={interactive ? { cursor: 'pointer' } : undefined}
                >
                    ★
                </span>
            ))}
        </div>
    );
}

function PostCard({ post, onVote }) {
    const cat = CATEGORIES.find(c => c.id === post.category) || CATEGORIES[0];

    return (
        <div className="cm-post-card">
            {/* Upvote column */}
            <div className="cm-vote-col">
                <button className="cm-vote-btn" onClick={() => onVote(post.id, 1)} title="Upvote">▲</button>
                <span className="cm-vote-count">{post.votes}</span>
                <button className="cm-vote-btn cm-vote-btn--down" onClick={() => onVote(post.id, -1)} title="Downvote">▼</button>
            </div>

            {/* Post content */}
            <div className="cm-post-body">
                <div className="cm-post-meta">
                    <span className="cm-category-badge" style={{ background: cat.color + '18', color: cat.color, borderColor: cat.color + '30' }}>
                        {cat.icon} {cat.label}
                    </span>
                    <span className="cm-post-author">{post.avatar} {post.author}</span>
                    <span className="cm-post-sep">·</span>
                    <span className="cm-post-location">{post.location}</span>
                    <span className="cm-post-sep">·</span>
                    <span className="cm-post-time">🕐 {post.time}</span>
                </div>

                <h3 className="cm-post-title">{post.title}</h3>
                <p className="cm-post-text">{post.body}</p>

                {post.rating > 0 && (
                    <div className="cm-post-rating">
                        <StarRating rating={post.rating} />
                        <span className="cm-rating-label">Effectiveness Rating</span>
                    </div>
                )}

                <div className="cm-post-footer">
                    <div className="cm-post-tags">
                        {post.tags.map(tag => (
                            <span key={tag} className="cm-tag">{tag}</span>
                        ))}
                    </div>
                    <div className="cm-post-actions">
                        <button className="cm-action-btn">💬 {post.comments} Comments</button>
                        <button className="cm-action-btn">↗ Share</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NewPostModal({ onClose, onSubmit }) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('crop-care');
    const [body, setBody] = useState('');
    const [rating, setRating] = useState(0);
    const [postType, setPostType] = useState('discussion');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        onSubmit({ title, category, body, rating: postType === 'review' ? rating : 0, type: postType });
        onClose();
    };

    return (
        <div className="cm-modal-overlay" onClick={onClose}>
            <div className="cm-modal" onClick={e => e.stopPropagation()}>
                <div className="cm-modal-header">
                    <h2>Create New Post</h2>
                    <button className="cm-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="cm-modal-form">
                    <div className="cm-form-row">
                        <label>Post Type</label>
                        <div className="cm-type-toggle">
                            <button type="button" className={`cm-type-btn ${postType === 'discussion' ? 'cm-type-btn--active' : ''}`} onClick={() => setPostType('discussion')}>💬 Discussion</button>
                            <button type="button" className={`cm-type-btn ${postType === 'review' ? 'cm-type-btn--active' : ''}`} onClick={() => setPostType('review')}>⭐ Review</button>
                        </div>
                    </div>

                    <div className="cm-form-row">
                        <label htmlFor="cm-cat">Category</label>
                        <select id="cm-cat" value={category} onChange={e => setCategory(e.target.value)} className="cm-select">
                            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="cm-form-row">
                        <label htmlFor="cm-title">Title</label>
                        <input id="cm-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What's on your mind?" className="cm-input" required />
                    </div>

                    <div className="cm-form-row">
                        <label htmlFor="cm-body">Details</label>
                        <textarea id="cm-body" value={body} onChange={e => setBody(e.target.value)} placeholder="Share your experience, ask a question, or give a tip..." rows={5} className="cm-textarea" required />
                    </div>

                    {postType === 'review' && (
                        <div className="cm-form-row">
                            <label>Rating</label>
                            <StarRating rating={rating} interactive onChange={setRating} />
                        </div>
                    )}

                    <div className="cm-form-actions">
                        <button type="button" className="cm-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="cm-btn-submit" disabled={!title.trim() || !body.trim()}>
                            🌾 Publish Post
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CommunityPanel() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [posts, setPosts] = useState(MOCK_POSTS);
    const [showModal, setShowModal] = useState(false);

    const filteredPosts = activeCategory === 'all'
        ? posts
        : posts.filter(p => p.category === activeCategory);

    const handleVote = (id, delta) => {
        setPosts(prev => prev.map(p =>
            p.id === id ? { ...p, votes: Math.max(0, p.votes + delta) } : p
        ));
    };

    const handleNewPost = (data) => {
        const newPost = {
            id: Date.now(),
            category: data.category,
            type: data.type,
            author: FARMER_PROFILE.name,
            location: FARMER_PROFILE.location,
            avatar: FARMER_PROFILE.avatar,
            time: 'Just now',
            votes: 0,
            title: data.title,
            body: data.body,
            tags: [],
            comments: 0,
            rating: data.rating,
        };
        setPosts(prev => [newPost, ...prev]);
    };

    return (
        <div className="cm-page">
            {/* ── Header ── */}
            <div className="cm-header">
                <div className="cm-header-left">
                    <h1 className="cm-title">Farmer Knowledge Exchange</h1>
                    <p className="cm-subtitle">Real experiences · Peer learning · Community intelligence</p>
                </div>
                <button className="cm-post-btn" onClick={() => setShowModal(true)}>
                    + Post Question
                </button>
            </div>

            {/* ── Category Filters ── */}
            <div className="cm-categories">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`cm-cat-pill ${activeCategory === cat.id ? 'cm-cat-pill--active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                        style={activeCategory === cat.id ? { background: cat.color, borderColor: cat.color } : undefined}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
            </div>

            {/* ── Two-column layout ── */}
            <div className="cm-layout">
                {/* Feed */}
                <div className="cm-feed">
                    {filteredPosts.length === 0 ? (
                        <div className="cm-empty">
                            <div className="cm-empty-icon">🌿</div>
                            <h3>No posts in this category yet</h3>
                            <p>Be the first to share your farming knowledge!</p>
                        </div>
                    ) : (
                        filteredPosts.map(post => (
                            <PostCard key={post.id} post={post} onVote={handleVote} />
                        ))
                    )}
                </div>

                {/* Sidebar */}
                <aside className="cm-sidebar">
                    {/* Profile Card */}
                    <div className="cm-profile-card">
                        <div className="cm-profile-header">
                            <div className="cm-profile-avatar">{FARMER_PROFILE.avatar}</div>
                            <div>
                                <h3 className="cm-profile-name">{FARMER_PROFILE.name}</h3>
                                <p className="cm-profile-location">📍 {FARMER_PROFILE.location}</p>
                            </div>
                        </div>
                        <div className="cm-profile-joined">🗓 Member since {FARMER_PROFILE.joined}</div>
                        <div className="cm-profile-crops">
                            {FARMER_PROFILE.crops.map(c => (
                                <span key={c} className="cm-crop-tag">🌾 {c}</span>
                            ))}
                        </div>
                        <div className="cm-profile-stats">
                            <div className="cm-stat">
                                <span className="cm-stat-value">{FARMER_PROFILE.stats.posts}</span>
                                <span className="cm-stat-label">Posts</span>
                            </div>
                            <div className="cm-stat">
                                <span className="cm-stat-value">{FARMER_PROFILE.stats.reviews}</span>
                                <span className="cm-stat-label">Reviews</span>
                            </div>
                            <div className="cm-stat">
                                <span className="cm-stat-value">{FARMER_PROFILE.stats.helpful}</span>
                                <span className="cm-stat-label">Helpful</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Contributors */}
                    <div className="cm-contributors-card">
                        <h3 className="cm-contributors-title">🏆 Top Contributors</h3>
                        <div className="cm-contributors-list">
                            {TOP_CONTRIBUTORS.map((c, i) => (
                                <div key={c.name} className="cm-contributor">
                                    <span className="cm-contributor-rank">#{i + 1}</span>
                                    <span className="cm-contributor-avatar">{c.avatar}</span>
                                    <div className="cm-contributor-info">
                                        <span className="cm-contributor-name">{c.name}</span>
                                        <span className="cm-contributor-meta">{c.posts} posts · {c.helpful} helpful</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="cm-tips-card">
                        <h3 className="cm-tips-title">💡 Community Guidelines</h3>
                        <ul className="cm-tips-list">
                            <li>Share real experiences with data</li>
                            <li>Be respectful to fellow farmers</li>
                            <li>Include location for context</li>
                            <li>Use hashtags for discoverability</li>
                            <li>Rate products honestly</li>
                        </ul>
                    </div>
                </aside>
            </div>

            {/* ── New Post Modal ── */}
            {showModal && (
                <NewPostModal
                    onClose={() => setShowModal(false)}
                    onSubmit={handleNewPost}
                />
            )}
        </div>
    );
}
