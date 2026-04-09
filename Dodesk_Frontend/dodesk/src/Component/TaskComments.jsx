// src/Component/TaskComments.jsx
// Feature 3 – Task Comments System

import React, { useState, useEffect, useRef } from "react";
import {
  Typography, TextField, Button, Avatar, IconButton, CircularProgress,
} from "@mui/material";
import SendIcon   from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useAuth } from "../Context/AuthContext";
import "./TaskComments.css";

const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diff < 1)    return "just now";
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return new Date(ts).toLocaleDateString();
};

export default function TaskComments({ projectId, taskId }) {
  const { api, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [posting,  setPosting]  = useState(false);
  const bottomRef = useRef(null);

  // ── Fetch comments ─────────────────────────────────────────
  const fetchComments = async () => {
    if (!projectId || !taskId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/comments/${projectId}/${taskId}`);
      setComments(res.data || []);
    } catch (e) {
      console.error("Failed to load comments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, [projectId, taskId]);

  // Scroll to bottom on new comment
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // ── Post comment ───────────────────────────────────────────
  const postComment = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await api.post(`/api/comments/${projectId}/${taskId}`, { text: text.trim() });
      setComments((prev) => [...prev, res.data]);
      setText("");
    } catch (e) {
      console.error("Failed to post comment", e);
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); }
  };

  // ── Delete comment ─────────────────────────────────────────
  const deleteComment = async (id) => {
    try {
      await api.delete(`/api/comments/${id}`);
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch (e) {
      console.error("Failed to delete comment", e);
    }
  };

  return (
    <div className="comments-section">
      {/* Header */}
      <div className="comments-header">
        <ChatBubbleOutlineIcon sx={{ fontSize: "1rem", color: "var(--accent-primary)" }} />
        <Typography className="comments-title">
          Comments ({comments.length})
        </Typography>
      </div>

      {/* Comment list */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">
            <CircularProgress size={20} sx={{ color: "var(--accent-primary)" }} />
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">
            <ChatBubbleOutlineIcon sx={{ fontSize: "1.8rem", opacity: 0.25, display: "block", margin: "0 auto 6px" }} />
            <Typography sx={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
              No comments yet — be the first!
            </Typography>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c._id} className={`comment-item ${c.user_id === user?.id ? "own" : ""}`}>
              <Avatar className="comment-avatar" sx={{ width: 28, height: 28, fontSize: "0.7rem" }}>
                {(c.user_name || "?")[0].toUpperCase()}
              </Avatar>
              <div className="comment-bubble">
                <div className="comment-meta">
                  <span className="comment-author">{c.user_name}</span>
                  <span className="comment-time">{timeAgo(c.created_at)}</span>
                </div>
                <Typography className="comment-text">{c.text}</Typography>
              </div>
              {c.user_id === user?.id && (
                <IconButton
                  size="small"
                  className="comment-delete-btn"
                  onClick={() => deleteComment(c._id)}
                  title="Delete comment"
                >
                  <DeleteIcon sx={{ fontSize: "0.8rem" }} />
                </IconButton>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input box */}
      <div className="comment-input-row">
        <Avatar className="comment-avatar" sx={{ width: 28, height: 28, fontSize: "0.7rem", flexShrink: 0 }}>
          {(user?.name || user?.email || "?")[0].toUpperCase()}
        </Avatar>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Write a comment… (Enter to send)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="comment-input"
          size="small"
        />
        <Button
          variant="contained"
          className="comment-send-btn"
          onClick={postComment}
          disabled={!text.trim() || posting}
          disableElevation
        >
          {posting ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <SendIcon sx={{ fontSize: "1rem" }} />}
        </Button>
      </div>
    </div>
  );
}