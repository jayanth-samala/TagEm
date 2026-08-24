import { useEffect, useState } from 'react';
import { useParams, Link} from 'react-router-dom';
import './Profile.css';

function normalizeProfile(data) {
    return {
        ...data,
        name: data?.name ?? "",
        genderIdentity: data?.genderIdentity ?? "",
        occupation: data?.occupation ?? "",
        bio: data?.bio ?? "",
        profilePicUrl: data?.profilePicUrl ?? "",
        resumeattached: data?.resumeattached ?? null,
    };
}

const ProfilePage = () => {
    const { id } = useParams();
    const user = JSON.parse(localStorage.getItem("user"));
    const profileId = id || user.id;
    console.log(user);
    const [profile, setProfile] = useState({
        name: "",
        genderIdentity: "",
        occupation: "",
        profilePicUrl: "https://anitawatkins.com/wp-content/uploads/2016/02/Generic-Profile-1600x1600.png",
        bio: "",
        resumeattached: null
    });
    
    const [connections, setConnections] = useState([]);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [isEditingResume, setIsEditingResume] = useState(false);
    const [image, handleImage] = useState(null);
    const [resume, setResume] = useState(null);
    const [isRemovingResume, setIsRemovingResume] = useState(false);
    const [resumeMessage, setResumeMessage] = useState("");
    const [requestStatus, setRequestStatus] = useState("connect");
    const [connectionTags, setConnectionTags] = useState([]);
    const [newConnectionTag, setNewConnectionTag] = useState("");
    const [editingConnectionTag, setEditingConnectionTag] = useState(null);
    const [editedConnectionTag, setEditedConnectionTag] = useState("");
    const [tagMessage, setTagMessage] = useState("");
    const [postContent, setPostContent] = useState("");
    const [postMessage, setPostMessage] = useState("");
    const [, setActiveCommentPostId] = useState(null);
    const [commentText, setCommentText] = useState("");
    const [viewingPost, setViewingPost] = useState(null);
    const [tagEms, setTagEms] = useState([]);
    async function fetchPosts() {
            try {
                const response = await fetch(`http://localhost:5001/api/posts/user/${profileId}`);
                if (response.ok) {
                    const data = await response.json();
                    setTagEms(data);
                } else {
                    console.error("Failed to fetch posts");
                }
            } catch (err) {
                console.error("Network error:", err);
            }
        }
    useEffect(() => {
        fetchPosts();
    }, [profileId]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        async function fetchProfileData() {
            const storedUserString = localStorage.getItem("user");
            if (!storedUserString) {
                console.log("No user is logged in");
                return;
            }
            try {
                const response = await fetch(`http://localhost:5001/api/Profile/${profileId}`);

                if (response.ok) {
                    const data = await response.json();
                    setProfile(normalizeProfile(data));
                } else {
                    console.error("Failed to fetch profile");
                }
            } catch (err) {
                console.error("Network error:", err);
            }
        }
        fetchProfileData();
    }, [profileId]);
        useEffect(() => {
        async function fetchConnectionsList() {
            if (user.id !== Number(profileId)) {
                setConnections([]);
                return;
            }
            try {
                const response = await fetch(`http://localhost:5001/api/connections/${profileId}`);
                
                if (response.ok) {
                    const data = await response.json();
                    setConnections(data);
                } else {
                    console.error("Failed to fetch connections");
                }
            } catch (err) {
                console.error("Network error:", err);
            }
        }
        fetchConnectionsList();
    }, [profileId, user.id]);

    useEffect(() => {
        async function fetchConnectionStatus() {

            try {
                const response = await fetch(
                    `http://localhost:5001/api/connections/status/${user.id}/${profileId}`
                );

                const data = await response.json();
                console.log("STATUS DATA:", data);

                if (response.ok) {
                    setRequestStatus(data.status);
                }
            } catch (err) {
                console.log(err);
            }
        }

        if (user.id !== Number(profileId)) {
            fetchConnectionStatus();
        }
    }, [user.id, profileId]);

    useEffect(() => {
        async function fetchPrivateConnectionTags() {
            if (user.id === Number(profileId)) {
                setConnectionTags([]);
                return;
            }
            try {
                const response = await fetch(`http://localhost:5001/api/connections/${user.id}`);
                if (!response.ok) return;
                const ownConnections = await response.json();
                const connection = ownConnections.find((item) => Number(item.id) === Number(profileId));
                setConnectionTags(connection?.tags || []);
            } catch (err) {
                console.error("Failed to load connection tags:", err);
            }
        }
        fetchPrivateConnectionTags();
    }, [user.id, profileId]);


    const handleInputChange = (e) => {
        console.log("hi");
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };
    const handleViewPost = async (postId) => {
        try {

            const response = await fetch(`http://localhost:5001/api/posts/${postId}`);
            if (response.ok) {
                const data = await response.json();
                setViewingPost(data);
            } else {
                console.error("Failed to fetch single post");
            }
        } catch (err) {
            console.error("Network error:", err);
        }
    };
    const handleLike = async (postId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/posts/${postId}/like`, {method: 'PUT'});
        if (response.ok){
                const updatedPost = await response.json();
                setTagEms(prevPosts => prevPosts.map(post => 
                        post.id === postId ? {
                            ...post,
                            likes_count: updatedPost.likes_count,
                            liked_by_user: updatedPost.liked_by_user
                        } : post
                    ));
            }
        }

     catch(err) {
console.error("Error liking post:", err);

        }    }
    const handleDeletePost = async (postId) => {
        if (!window.confirm("Delete this post and all of its replies? This cannot be undone.")) return;

        setPostMessage("");
        try {
            const response = await fetch(`http://localhost:5001/api/posts/${postId}`, {
                method: "DELETE"
            });
            const data = await response.json();
            if (!response.ok) {
                setPostMessage(data.message || "Unable to delete post");
                return;
            }

            setTagEms((currentPosts) => currentPosts.filter((post) => post.id !== postId));
            if (viewingPost?.id === postId) setViewingPost(null);
            setPostMessage("Post deleted.");
        } catch (error) {
            console.error("Error deleting post:", error);
            setPostMessage("Unable to delete post");
        }
    };
    const handleSaveDetails = async () => {
        console.log("BUTTON CLICKED");
        const formData = new FormData();
        formData.append("name", profile.name ?? "");
        formData.append("genderIdentity", profile.genderIdentity ?? "");
        formData.append("occupation", profile.occupation ?? "");
        if (image) {
            formData.append("image", image);
        }
        formData.append("bio", profile.bio ?? "");
        if (resume) {
            formData.append("resume", resume);
        }

        const API_URL = `http://localhost:5001/api/Profile/${profileId}`;
        try {
            const response = await fetch(API_URL, {
                method: 'PUT',
                body: formData
            });

            const data = await response.json();
            if (!response.ok) {
                console.log("error");
                return;
            }
            setProfile(normalizeProfile(data));
            handleImage(null);
            setResume(null);
        } catch (err) {
            console.log(err);
        }

        setIsEditingDetails(false);
        setIsEditingBio(false);
        setIsEditingResume(false);
    };
    const handleFetch = async () => {
        const API_URL = `http://localhost:5001/api/Profile/${profileId}`;
        console.log(API_URL);
        const response = await fetch(API_URL);
        const data = await response.json();
        setProfile(normalizeProfile(data));
        console.log("FETCHED PROFILE:", data);
        console.log(profile);
    }
    const handleChangeResume = async () => {
        if (!window.confirm("Remove your current resume and upload a replacement?")) return;

        setIsRemovingResume(true);
        setResumeMessage("");
        try {
            const response = await fetch(`http://localhost:5001/api/Profile/${profileId}/resume`, {
                method: "DELETE"
            });
            const data = await response.json();
            if (!response.ok) {
                setResumeMessage(data.message || "Unable to remove resume");
                return;
            }

            setProfile((currentProfile) => ({ ...currentProfile, resumeattached: null }));
            setResume(null);
            setIsEditingResume(true);
            setResumeMessage("Current resume removed. Choose a replacement.");
        } catch (error) {
            console.error("Error removing resume:", error);
            setResumeMessage("Unable to remove resume");
        } finally {
            setIsRemovingResume(false);
        }
    };
    const handleCommentSubmit = async (postId) => {
        if (!commentText.trim()) return;

        try {
            const response = await fetch ("http://localhost:5001/api/posts", {
                method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
        body: JSON.stringify({
            content: commentText,
            parent_post_id: postId
        })
    });
    if (response.ok){
        setCommentText("");
        setActiveCommentPostId(null);
            if (viewingPost) {
                handleViewPost(viewingPost.id); 
            } else {
                fetchPosts(); 
                }
                } else{
        console.log("Failed to create comment");
    }
        } catch(err){
            console.log("Error creating comment:", err);
        }
    };
    const handleDeleteReply = async (replyId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/posts/replies/${replyId}`, {
                method: "DELETE"
            });
            if (!response.ok) {
                console.error("Failed to delete reply");
                return;
            }
            setViewingPost((currentPost) => currentPost ? {
                ...currentPost,
                comments: currentPost.comments.filter((comment) => comment.id !== replyId)
            } : currentPost);
        } catch (err) {
            console.error("Error deleting reply:", err);
        }
    };
    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "Permanently delete your account and all associated data? This cannot be undone."
        );
        if (!confirmed) return;

        try {
            const response = await fetch("http://localhost:5001/api/users/account", {
                method: "DELETE"
            });
            const data = await response.json();
            if (!response.ok) {
                window.alert(data.message || "Unable to delete account");
                return;
            }
            localStorage.removeItem("user");
            window.location.assign("/login");
        } catch (error) {
            console.error("Account deletion error:", error);
            window.alert("Unable to delete account");
        }
    };
    const handleConnectRequest = async () => {
        try {
            const API_URL = "http://localhost:5001/api/connections/request";
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    receiver_id: profileId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.log(data.message);
                return;
            }

            alert("Connection request sent!");
            setRequestStatus("pending");
        } catch (err) {
            console.log(err);
        }
    };

    const addConnectionTag = async () => {
        const tag = newConnectionTag.trim();
        if (!tag) return;
        const response = await fetch("http://localhost:5001/api/jobs/connection-tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ connection_user_id: Number(profileId), tag_type: tag }),
        });
        const data = await response.json();
        setTagMessage(data.message || "");
        if (!response.ok) return;
        setConnectionTags((tags) => tags.includes(tag) ? tags : [...tags, tag].sort());
        setNewConnectionTag("");
    };

    const updateConnectionTag = async (oldTag) => {
        const newTag = editedConnectionTag.trim();
        if (!newTag) return;
        const response = await fetch(`http://localhost:5001/api/jobs/connection-tags/${profileId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ old_tag: oldTag, new_tag: newTag }),
        });
        const data = await response.json();
        setTagMessage(data.message || "");
        if (!response.ok) return;
        setConnectionTags((tags) => tags.map((tag) => tag === oldTag ? data.tag : tag).sort());
        setEditingConnectionTag(null);
        setEditedConnectionTag("");
    };

    const deleteConnectionTag = async (tag) => {
        const response = await fetch(
            `http://localhost:5001/api/jobs/connection-tags/${user.id}/${profileId}/${encodeURIComponent(tag)}`,
            { method: "DELETE" }
        );
        const data = await response.json();
        setTagMessage(data.message || "");
        if (response.ok) setConnectionTags((tags) => tags.filter((item) => item !== tag));
    };

    useEffect(() => {
        handleFetch();
        window.scrollTo(0,0);
    }, [profileId]) // eslint-disable-line react-hooks/exhaustive-deps
    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5001/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content: postContent,
                    parent_post_id: null // Head post
                })
            });
            if (!response.ok) {
                console.log("Failed to create post");
            }
            const data = await response.json();
            console.log("Created post:", data);
            setTagEms([data, ...tagEms]);
            setPostContent(""); 
            handleFetch(); 
        } catch (err) {
            console.log("Error creating post:", err);
        }
    };
    return (
        <div className="profile-page">
            <div className="profile-container">

                <header className="profile-header">
                    <img
                        src={image ? URL.createObjectURL(image) : profile.profilePicUrl || "https://anitawatkins.com/wp-content/uploads/2016/02/Generic-Profile-1600x1600.png"}
                        alt="Profile"
                        className="profile-pic"
                    />
                    <div className="header-text">
                        {user.id === Number(profileId) && isEditingDetails ? (
                                <div className="edit-form">
                                    <input
                                        type="text"
                                        name="name"
                                        value={profile.name || ""}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                        placeholder="Full Name"
                                    />
                                    <input
                                        type="text"
                                        name="genderIdentity"
                                        value={profile.genderIdentity || ""}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                        placeholder="Gender Identity"
                                    />
                                    <input
                                        type="text"
                                        name="occupation"
                                        value={profile.occupation || ""}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                        placeholder="Occupation"
                                    />
                                    <input
                                        type="file"
                                        name="Profile Picture"
                                        accept="image/png, image/jpeg"
                                        onChange={(e) => {
                                            console.log(e.target.files[0]);
                                            handleImage(e.target.files[0]);
                                        }}
                                        className="edit-input"
                                    />
                            </div>
                        ) : (
                            <>
                            <div className="profile-name-row">
                                <h1 className="profile-name">{profile.name}</h1>
                                {profile.genderIdentity && (
                                    <p className="profile-subtext">{profile.genderIdentity}</p>
                                )}
                            </div>
                            <p className="profile-occupation">{profile.occupation}</p>
                            </>
                        )}
                        <div className="profile-header-action">
                            {user.id === Number(profileId) ? (isEditingDetails ? (
                                <button className="edit-button save-button" onClick={handleSaveDetails}>
                                    Save Details
                                </button>
                            ) : (
                                <button className="edit-button" onClick={() => {
                                    console.log("edit clicked");
                                    setIsEditingDetails(true);
                                }}
                                >
                                    Edit Details
                                </button>
                            )) : (
                                <button
                                    className="connect"
                                    onClick={handleConnectRequest}
                                    disabled={
                                        requestStatus === "pending" ||
                                        requestStatus === "connected" ||
                                        requestStatus === "accepted"
                                    }
                                >
                                    {requestStatus === "connected" || requestStatus === "accepted" ? "Connected" : requestStatus === "pending" ? "Pending" : "Connect"}
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <section className="profile-section">
                    <div className="section-header">
                        <h2>Bio</h2>
                    </div>
                    {user.id === Number(profileId) ? (isEditingBio ? (
                        <input
                            type="text"
                            name="bio"
                            value={profile.bio || ""}
                            onChange={handleInputChange}
                            className="edit-input"
                            placeholder="Tell us about yourself..."
                        />
                    ) : (
                        <p className="bio-text">{profile.bio}</p>
                    )) : (<p className="bio-text">{profile.bio}</p>)}
                    {user.id === Number(profileId) ? (isEditingBio ? (
                        <button className="edit-button section-bottom-action save-button" onClick={handleSaveDetails}>
                            Save Bio
                        </button>
                    ) : (
                        <button className="edit-button section-bottom-action" onClick={() => setIsEditingBio(true)}>
                            Edit Bio
                        </button>
                    )) : null}
                </section>

                <section className="profile-section">
                    <div className="section-header">
                        <h2>Resume</h2>
                    </div>
                    {user.id === Number(profileId) ? (isEditingResume ? (
                        <>
                            <input
                                type="file"
                                name="resume"
                                onChange={(e) => setResume(e.target.files[0])}
                                className="edit-input"
                                accept="application/pdf,.pdf"
                            />
                            <button className="edit-button section-bottom-action save-button" onClick={handleSaveDetails}>
                                Save Resume
                            </button>
                        </>
                    ) : (
                        <>
                            {profile.resumeattached ? (
                                <p className="resume-text">
                                    <a
                                        href={`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5001" : "")}${profile.resumeattached}`}
                                        target="_blank"
                                    >
                                        Resume
                                    </a>
                                </p>
                            ) : <p className="resume-text">No resume uploaded</p>}
                            <div className="resume-actions section-bottom-action">
                                <button className="edit-button" disabled={isRemovingResume} onClick={() => {
                                    setResumeMessage("");
                                    if (profile.resumeattached) {
                                        handleChangeResume();
                                    } else {
                                        setIsEditingResume(true);
                                    }
                                }}>
                                    {isRemovingResume ? "Removing..." : profile.resumeattached ? "Change Resume" : "Upload Resume"}
                                </button>
                            </div>
                            {resumeMessage && <p className="resume-message" role="status">{resumeMessage}</p>}
                        </>
                    )) : null}
                </section>
                {user.id !== Number(profileId) &&
                  (requestStatus === "connected" || requestStatus === "accepted") && (
                    <section className="profile-section connection-tag-manager">
                        <div className="section-header">
                            <h2>Your Tags</h2>
                        </div>
                        <p className="tag-privacy-note">Only you can see these tags.</p>

                        <div className="profile-tag-list">
                            {connectionTags.length > 0 ? connectionTags.map((tag) => (
                                <div className="profile-tag-row" key={tag}>
                                    {editingConnectionTag === tag ? (
                                        <input
                                            value={editedConnectionTag}
                                            onChange={(event) => setEditedConnectionTag(event.target.value)}
                                            aria-label={`Edit ${tag} tag`}
                                            maxLength={255}
                                        />
                                    ) : (
                                        <span>{tag}</span>
                                    )}

                                    <div className="profile-tag-actions">
                                        {editingConnectionTag === tag ? (
                                            <>
                                                <button type="button" onClick={() => updateConnectionTag(tag)}>Save</button>
                                                <button className="secondary-tag-button" type="button" onClick={() => {
                                                    setEditingConnectionTag(null);
                                                    setEditedConnectionTag("");
                                                }}>Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button type="button" onClick={() => {
                                                    setEditingConnectionTag(tag);
                                                    setEditedConnectionTag(tag);
                                                }}>Edit</button>
                                                <button className="danger-tag-button" type="button" onClick={() => deleteConnectionTag(tag)}>Delete</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )) : <p className="tag-privacy-note">No tags added yet.</p>}
                        </div>

                        <div className="profile-tag-add">
                            <input
                                value={newConnectionTag}
                                onChange={(event) => setNewConnectionTag(event.target.value)}
                                placeholder="Add a tag"
                                maxLength={255}
                            />
                            <button type="button" onClick={addConnectionTag}>Add Tag</button>
                        </div>
                        {tagMessage && <p className="tag-message">{tagMessage}</p>}
                    </section>
                )}
                {user.id === Number(profileId) && <section className="profile-section">
                    <div className="section-header">
                        <h2>Network</h2>
                    </div>
                    <p>{profile.name} has {connections.length} people in their network!</p>
                    
                    <div className="profile-connections-grid">
                        {connections.length > 0 ? (
                            connections.map((conn) => (
                                <Link key={conn.id} to={`/profile/${conn.id}`}>
                                    <div className="mini-connection-card">
                                        <img 
                                            src={conn.profilePicUrl || "https://anitawatkins.com/wp-content/uploads/2016/02/Generic-Profile-1600x1600.png"} 
                                            alt={conn.name} 
                                            className="connection-img"
                                            style={{ cursor: "pointer" }}
                                        />
                                        <p className="connection-name">
                                            {conn.name}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className='connections-missing'>No connections to display yet.</p>
                        )}
                    </div>
                    <Link className="section-bottom-link" to="/Connections">
                        <button className="edit-button section-bottom-action">
                            Manage Network
                        </button>
                    </Link>
                </section>}

                {user.id === Number(profileId) && (
                    <section className="profile-section danger-zone">
                        <div className="section-header">
                            <h2>Delete Account</h2>
                        </div>
                        <p>Permanently delete your account and all associated data.</p>
                        <button type="button" className="delete-account-button" onClick={handleDeleteAccount}>
                            Delete My Account
                        </button>
                    </section>
                )}

            </div>
            <div className="My-TagEms">
                {viewingPost ? (
                    <div className="focused-post-view">
                        <button className="edit-button"  onClick={() => setViewingPost(null)}>
                            Head Back
                        </button>

                        <article className="tag-em-post" style={{ border: "2px solid #ccc" }}>
                            <div className="tag-em-content">
                                <div className="tag-em-meta">
                                <div className="tag-em-avatar">
                                        <img
                                            src={image ? URL.createObjectURL(image) : profile.profilePicUrl || "https://anitawatkins.com/wp-content/uploads/2016/02/Generic-Profile-1600x1600.png"}
                                            alt={profile.name}
                                        />
                                    </div>
                                    <strong>{profile.name}</strong>
                                    <span className="tag-em-time">
                                        {viewingPost.created_at ? new Date(viewingPost.created_at).toLocaleDateString() : viewingPost.timestamp}
                                    </span>
                                </div>
                                <p className="With-Replies-Text">{viewingPost.content}</p>

                                {Number(viewingPost.user_id) === Number(user.id) && (
                                    <button
                                        type="button"
                                        className="delete-post-button"
                                        onClick={() => handleDeletePost(viewingPost.id)}
                                    >
                                        Delete Post
                                    </button>
                                )}

                                <div className="commentBox">
                                    <textarea className="Reply-Box"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder='Type your reply...'
                                    /> 
                                    <button onClick={() => handleCommentSubmit(viewingPost.id)} disabled={!commentText.trim()} className='edit-button'
                                    >
                                        Submit Reply
                                    </button>
                                </div>
                                {viewingPost.comments && viewingPost.comments.length > 0 && (
                                    <div className="post-comments-section">
                                        <h4>Replies</h4>
                                        {viewingPost.comments.map((comment) => (
                                            <div key={`comment-${comment.id}`} className="comment-item">
                                                <div className="tag-em-meta">
                                                    <strong>{comment.user_name}</strong>
                                                    <span className="tag-em-dot">·</span>
                                                    <span className="tag-em-time">
                                                        {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : "Just now"}
                                                    </span>
                                                </div>
                                                <p className="tag-em-text">
                                                    {comment.content}
                                                </p>
                                                {Number(comment.user_id) === Number(user.id) && (
                                                    <button
                                                        type="button"
                                                        className="delete-reply-button"
                                                        onClick={() => handleDeleteReply(comment.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </article>
                    </div>

                ) : (
                    <> {/*not in a reply section*/}
                    {user.id === Number(profileId) && (
                        <div className="create-post-section">
                            <h3>Create a Blog Post</h3>
                            <form onSubmit={handleCreatePost}>
                                <textarea className="Reply-Box"
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                    placeholder="What's on your mind?"
                                    rows="5"
                                />
                                <button className="edit-button" type="submit" disabled={!postContent.trim()}>Post</button>
                            </form>
                        </div>
                    )}
                        <h3>{tagEms.length > 0 ? "Posts" : `${profile.name} has no current Posts`}</h3>
                        {postMessage && <p className="post-message" role="status">{postMessage}</p>}
                        <div className="tag-ems-list"> 
                            {tagEms.map((post, index) => (
                                <article key={`post-${post.id}-${index}`} className="tag-em-post">
                                    <div className="tag-em-avatar">
                                        <img
                                            src={image ? URL.createObjectURL(image) : profile.profilePicUrl || "https://anitawatkins.com/wp-content/uploads/2016/02/Generic-Profile-1600x1600.png"}
                                            alt={profile.name}
                                        />
                                    </div>
                                    <div className="tag-em-content">
                                        <div className="tag-em-meta">
                                            <strong>{profile.name}</strong>
                                            <span className="tag-em-dot">·</span>
                                            <span className="tag-em-time">
                                                {post.created_at ? new Date(post.created_at).toLocaleDateString() : post.timestamp}
                                            </span>
                                        </div>
                                        <p className="tag-em-text">{post.content}</p> 
                                        
                                        <div className="tag-em-actions">
                                            <button 
                                                className="action-btn reply-btn"
                                                onClick={() => handleViewPost(post.id)}
                                            >
                                                See People's Thoughts
                                            </button>
                                            <button
                                            className={`action-btn like-btn${post.liked_by_user ? " liked" : ""}`}
                                            onClick={() => handleLike(post.id)}
                                            aria-pressed={Boolean(post.liked_by_user)}
                                            aria-label={`${post.liked_by_user ? "Unlike" : "Like"} post`}
                                            >
                                                ❤️ <span className="like-count">{post.likes_count || post.likes || 0}</span>
                                            </button>
                                            {Number(post.user_id) === Number(user.id) && (
                                                <button
                                                    type="button"
                                                    className="action-btn delete-post-button"
                                                    onClick={() => handleDeletePost(post.id)}
                                                >
                                                    Delete Post
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
