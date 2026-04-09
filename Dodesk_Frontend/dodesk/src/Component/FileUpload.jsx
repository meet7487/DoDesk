// src/Component/FileUpload.jsx
// Feature 4 – File Upload and Attachments

import React, { useState, useEffect, useRef } from "react";
import { Typography, IconButton, CircularProgress, LinearProgress } from "@mui/material";
import AttachFileIcon    from "@mui/icons-material/AttachFile";
import DeleteIcon        from "@mui/icons-material/Delete";
import DownloadIcon      from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon         from "@mui/icons-material/Image";
import PictureAsPdfIcon  from "@mui/icons-material/PictureAsPdf";
import { useAuth } from "../Context/AuthContext";
import "./FileUpload.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ICON_MAP = {
  ".pdf":  <PictureAsPdfIcon sx={{ color: "#ef4444", fontSize: "1.2rem" }} />,
  ".png":  <ImageIcon sx={{ color: "#4f8ef7", fontSize: "1.2rem" }} />,
  ".jpg":  <ImageIcon sx={{ color: "#4f8ef7", fontSize: "1.2rem" }} />,
  ".jpeg": <ImageIcon sx={{ color: "#4f8ef7", fontSize: "1.2rem" }} />,
  ".gif":  <ImageIcon sx={{ color: "#a78bfa", fontSize: "1.2rem" }} />,
};

const getExt = (name = "") => name.slice(name.lastIndexOf(".")).toLowerCase();
const fmtSize = (b) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

export default function FileUpload({ projectId, taskId }) {
  const { api } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [dragOver,    setDragOver]    = useState(false);
  const inputRef = useRef(null);

  // ── Fetch existing attachments ──────────────────────────────
  const fetchAttachments = async () => {
    if (!projectId || !taskId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/attachments/${projectId}/${taskId}`);
      setAttachments(res.data || []);
    } catch (e) {
      console.error("Failed to load attachments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttachments(); }, [projectId, taskId]);

  // ── Upload handler ──────────────────────────────────────────
  const uploadFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setProgress(0);

    try {
      const res = await api.post(
        `/api/attachments/${projectId}/${taskId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            setProgress(Math.round((e.loaded * 100) / e.total));
          },
        }
      );
      setAttachments((prev) => [res.data, ...prev]);
    } catch (e) {
      const msg = e?.response?.data?.detail || "Upload failed.";
      alert(msg);
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => uploadFile(e.target.files?.[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    uploadFile(e.dataTransfer.files?.[0]);
  };

  // ── Delete attachment ───────────────────────────────────────
  const deleteAttachment = async (id) => {
    if (!window.confirm("Delete this attachment?")) return;
    try {
      await api.delete(`/api/attachments/${id}`);
      setAttachments((prev) => prev.filter((a) => a._id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  return (
    <div className="file-upload-section">
      <div className="fu-header">
        <AttachFileIcon sx={{ fontSize: "1rem", color: "var(--accent-primary)" }} />
        <Typography className="fu-title">Attachments ({attachments.length})</Typography>
      </div>

      {/* Drop zone */}
      <div
        className={`fu-dropzone ${dragOver ? "drag-active" : ""} ${uploading ? "uploading" : ""}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.gif,.docx,.xlsx,.txt,.zip"
        />
        {uploading ? (
          <div className="fu-uploading">
            <CircularProgress size={20} sx={{ color: "var(--accent-primary)" }} />
            <Typography sx={{ fontSize: "12px", color: "var(--text-muted)", mt: 1 }}>
              Uploading… {progress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                mt: 1, width: "100%", borderRadius: "4px",
                "& .MuiLinearProgress-bar": { background: "var(--accent-primary)" },
                background: "var(--bg-muted)",
              }}
            />
          </div>
        ) : (
          <>
            <AttachFileIcon sx={{ fontSize: "1.5rem", color: "var(--text-muted)", mb: 1 }} />
            <Typography sx={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
              <strong style={{ color: "var(--accent-primary)" }}>Click to upload</strong> or drag & drop<br />
              <span style={{ fontSize: "11px" }}>PDF, Images, DOCX, XLSX, TXT, ZIP (max 10 MB)</span>
            </Typography>
          </>
        )}
      </div>

      {/* Attachment list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
          <CircularProgress size={18} sx={{ color: "var(--accent-primary)" }} />
        </div>
      ) : (
        <div className="fu-list">
          {attachments.map((a) => {
            const ext  = getExt(a.original_name);
            const icon = ICON_MAP[ext] || <InsertDriveFileIcon sx={{ color: "var(--text-muted)", fontSize: "1.2rem" }} />;
            return (
              <div key={a._id} className="fu-item">
                <div className="fu-item-icon">{icon}</div>
                <div className="fu-item-info">
                  <Typography className="fu-item-name" title={a.original_name}>
                    {a.original_name}
                  </Typography>
                  <Typography className="fu-item-meta">
                    {fmtSize(a.size_bytes)} · {a.uploader_name}
                  </Typography>
                </div>
                <div className="fu-item-actions">
                  <IconButton
                    size="small"
                    href={`${API_BASE}${a.url}`}
                    target="_blank"
                    title="Download"
                    sx={{ color: "var(--accent-primary)" }}
                  >
                    <DownloadIcon sx={{ fontSize: "0.9rem" }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => deleteAttachment(a._id)}
                    title="Delete"
                    sx={{ color: "var(--danger)" }}
                  >
                    <DeleteIcon sx={{ fontSize: "0.9rem" }} />
                  </IconButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}