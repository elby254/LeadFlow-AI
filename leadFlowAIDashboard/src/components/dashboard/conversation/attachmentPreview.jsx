/**
 * ==========================================================
 *
 * WhatsApp-style attachment preview component.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Preview uploaded attachments
 * ✓ Image preview
 * ✓ File preview
 * ✓ Remove attachment
 * ✓ File size display
 * ✓ File type icon
 * ✓ Multiple attachments
 *
 * Used By
 * ----------------------------------------------------------
 * MessageComposer.jsx
 * ChatWindow.jsx
 *
 * ==========================================================
 */

import {
  File,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  X,
  Download,
} from "lucide-react";

/* ==========================================================
   HELPERS
========================================================== */

const getFileIcon = (type = "") => {
  if (type.startsWith("image/")) {
    return <ImageIcon size={18} />;
  }

  if (type.startsWith("video/")) {
    return <Video size={18} />;
  }

  if (type.startsWith("audio/")) {
    return <Music size={18} />;
  }

  if (
    type.includes("pdf") ||
    type.includes("word") ||
    type.includes("text")
  ) {
    return <FileText size={18} />;
  }

  return <File size={18} />;
};

const formatSize = (bytes = 0) => {
  if (!bytes) return "";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(
      1
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};

/* ==========================================================
   COMPONENT
========================================================== */

const Attachments = ({
  attachments = [],
  editable = false,
  downloadable = false,
  onRemove,
}) => {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {attachments.map(
        (attachment, index) => {
          const isImage =
            attachment.type?.startsWith(
              "image/"
            );

          return (
            <div
              key={
                attachment.id ||
                attachment.name ||
                index
              }
              className="overflow-hidden rounded-xl border bg-white"
            >
              {/* =====================================
                  IMAGE
              ====================================== */}

              {isImage &&
                attachment.preview && (
                  <img
                    src={
                      attachment.preview
                    }
                    alt={
                      attachment.name
                    }
                    className="max-h-64 w-full object-cover"
                  />
                )}

              {/* =====================================
                  FILE INFO
              ====================================== */}

              <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
                    {getFileIcon(
                      attachment.type
                    )}
                  </div>

                  <div>
                    <p className="max-w-xs truncate text-sm font-medium">
                      {attachment.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {formatSize(
                        attachment.size
                      )}
                    </p>
                  </div>
                </div>

                {/* =============================
                    ACTIONS
                ============================== */}

                <div className="flex items-center gap-2">
                  {downloadable && (
                    <button
                      className="rounded-lg p-2 transition hover:bg-gray-100"
                      title="Download"
                    >
                      <Download
                        size={18}
                      />
                    </button>
                  )}

                  {editable && (
                    <button
                      onClick={() =>
                        onRemove?.(
                          attachment,
                          index
                        )
                      }
                      className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                      title="Remove"
                    >
                      <X
                        size={18}
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
};

export default Attachments;