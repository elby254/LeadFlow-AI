/**
 * ==========================================================
 * LeadFlow AI
 * useAttachments Hook
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Handles conversation attachments.
 *
 * Supports
 * ----------------------------------------------------------
 * ✓ Images
 * ✓ PDFs
 * ✓ Property brochures
 * ✓ Contracts
 * ✓ Customer documents
 * ✓ Upload progress
 * ✓ Offline upload queue
 * ✓ Preview
 * ✓ Delete
 * ✓ Download
 *
 * Used By
 * ----------------------------------------------------------
 * MessageComposer
 * AttachmentUploader
 * ImageUploader
 * PropertyRecommendationPanel
 *
 * Backend
 * ----------------------------------------------------------
 * POST   /api/attachments/upload
 * DELETE /api/attachments/:id
 * GET    /api/attachments/:id
 *
 * ==========================================================
 */

import { useState } from "react";
import { useCallback } from "react";

import attachmentService from "../services/conversation/attachmentService";

/* ==========================================================
   MAX FILE SIZE
========================================================== */

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

/* ==========================================================
   ALLOWED FILE TYPES
========================================================== */

const ALLOWED_TYPES = [

  "image/jpeg",

  "image/png",

  "image/webp",

  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

];

/* ==========================================================
   HOOK
========================================================== */

const useAttachments = () => {

  /* ========================================================
     STATE
  ======================================================== */

  const [

    attachments,

    setAttachments,

  ] = useState([]);

  const [

    uploading,

    setUploading,

  ] = useState(false);

  const [

    uploadProgress,

    setUploadProgress,

  ] = useState(0);

  const [

    error,

    setError,

  ] = useState("");

  const [

    offlineQueue,

    setOfflineQueue,

  ] = useState([]);

  /* ========================================================
     VALIDATION
  ======================================================== */

  const validateFile = useCallback(

    (file) => {

      if (!file) {

        return "No file selected.";

      }

      if (

        !ALLOWED_TYPES.includes(file.type)

      ) {

        return "Unsupported file type.";

      }

      if (

        file.size > MAX_FILE_SIZE

      ) {

        return "File exceeds 20 MB limit.";

      }

      return null;

    },

    []

  );

  /* ========================================================
     UPLOAD ATTACHMENT
  ======================================================== */

  const uploadAttachment = useCallback(

    async (file) => {

      const validationError = validateFile(file);

      if (validationError) {

        setError(validationError);

        return null;

      }

      try {

        setUploading(true);

        setError("");

        setUploadProgress(0);

        /**
         * Optimistic attachment
         */

        const temporaryAttachment = {

          id: `tmp-${Date.now()}`,

          name: file.name,

          type: file.type,

          size: file.size,

          url: URL.createObjectURL(file),

          status: "uploading",

          createdAt: new Date().toISOString(),

        };

        setAttachments((previous) => [

          ...previous,

          temporaryAttachment,

        ]);

        /**
         * Upload
         */

        const uploadedAttachment =

          await attachmentService.uploadAttachment(

            file,

            (progress) => {

              setUploadProgress(progress);

            }

          );

        /**
         * Replace temporary attachment
         */

        setAttachments((previous) =>

          previous.map((attachment) =>

            attachment.id === temporaryAttachment.id

              ? uploadedAttachment

              : attachment

          )

        );

        return uploadedAttachment;

      }

      catch (err) {

        console.error(

          "Attachment upload failed",

          err

        );

        /**
         * Store in offline queue
         */

        setOfflineQueue((previous) => [

          ...previous,

          file,

        ]);

        /**
         * Mark failed
         */

        setAttachments((previous) =>

          previous.map((attachment) =>

            attachment.name === file.name

              ? {

                  ...attachment,

                  status: "failed",

                }

              : attachment

          )

        );

        setError(

          err?.message ||

          "Unable to upload attachment."

        );

        return null;

      }

      finally {

        setUploading(false);

        setUploadProgress(0);

      }

    },

    [

      validateFile,

    ]

  );

  /* ========================================================
     PREVIEW ATTACHMENT
  ======================================================== */

  const previewAttachment = useCallback(

    (attachment) => {

      if (!attachment) return;

      window.open(

        attachment.url,

        "_blank",

        "noopener,noreferrer"

      );

    },

    []

  );

  /* ========================================================
     REMOVE ATTACHMENT (LOCAL)
  ======================================================== */

  const removeAttachment = useCallback(

    (attachmentId) => {

      setAttachments((previous) =>

        previous.filter(

          (attachment) =>

            attachment.id !== attachmentId

        )

      );

    },

    []

  );

  /* ========================================================
     CLEAR ALL ATTACHMENTS
  ======================================================== */

  const clearAttachments = useCallback(

    () => {

      setAttachments([]);

      setUploadProgress(0);

      setError("");

    },

    []

  );

  /* ========================================================
     DELETE ATTACHMENT
     Removes attachment from backend
  ======================================================== */

  const deleteAttachment = useCallback(

    async (attachmentId) => {

      try {

        await attachmentService.deleteAttachment(
          attachmentId
        );

        setAttachments((previous) =>

          previous.filter(
            (attachment) =>
              attachment.id !== attachmentId
          )

        );

      } catch (err) {

        console.error(
          "Attachment deletion failed",
          err
        );

        setError(
          err?.message ||
          "Unable to delete attachment."
        );

      }

    },

    []

  );

  /* ========================================================
     DOWNLOAD ATTACHMENT
  ======================================================== */

  const downloadAttachment = useCallback(

    async (attachment) => {

      try {

        if (!attachment) return;

        await attachmentService.downloadAttachment(
          attachment.id
        );

      } catch (err) {

        console.error(
          "Attachment download failed",
          err
        );

        setError(
          err?.message ||
          "Unable to download attachment."
        );

      }

    },

    []

  );

  /* ========================================================
     RETRY OFFLINE UPLOADS
  ======================================================== */

  const retryOfflineUploads = useCallback(

    async () => {

      if (!offlineQueue.length) return;

      const queue = [...offlineQueue];

      setOfflineQueue([]);

      for (const file of queue) {

        try {

          await uploadAttachment(file);

        }

        catch {

          setOfflineQueue((previous) => [

            ...previous,

            file,

          ]);

        }

      }

    },

    [

      offlineQueue,

      uploadAttachment,

    ]

  );

  /* ========================================================
     PUBLIC API
  ======================================================== */

  return {

    /* State */

    attachments,

    uploading,

    uploadProgress,

    error,

    offlineQueue,

    /* Actions */

    uploadAttachment,

    deleteAttachment,

    previewAttachment,

    downloadAttachment,

    removeAttachment,

    clearAttachments,

    retryOfflineUploads,

  };

};

export default useAttachments;