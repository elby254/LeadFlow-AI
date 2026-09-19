/**
 * ==========================================================
 * Handles voice note recording, playback and uploads.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Record voice notes
 * ✓ Pause / Resume recording
 * ✓ Stop recording
 * ✓ Preview recording
 * ✓ Upload voice note
 * ✓ Offline upload queue
 * ✓ Recording timer
 * ✓ Delete recordings
 *
 * Used By
 * ----------------------------------------------------------
 * Conversation Center
 * Message Composer
 * Viewer Conversations
 * Agent Conversations
 *
 * Browser APIs
 * ----------------------------------------------------------
 * MediaRecorder
 * MediaDevices.getUserMedia()
 * HTMLAudioElement
 *
 * Backend
 * ----------------------------------------------------------
 * POST   /api/messages/voice
 * DELETE /api/messages/voice/:id
 *
 * ==========================================================
 */

import { useState } from "react";
import { useRef } from "react";
import { useCallback } from "react";
import { useEffect } from "react";

import { useAuth } from "./useAuth";

import voiceNoteService from "../services/conversation/voiceNoteService";

/* ==========================================================
   MAX RECORDING LENGTH
========================================================== */

const MAX_DURATION = 300; // seconds (5 minutes)

/* ==========================================================
   HOOK
========================================================== */

const useVoiceNotes = () => {

  /* ========================================================
     AUTH
  ======================================================== */

  const {

    user,

    hasRole,

  } = useAuth();

  /* ========================================================
     RECORDING STATE
  ======================================================== */

  const [

    recording,

    setRecording,

  ] = useState(false);

  const [

    paused,

    setPaused,

  ] = useState(false);

  /* ========================================================
     RECORDER
  ======================================================== */

  const mediaRecorder = useRef(null);

  const mediaStream = useRef(null);

  const chunks = useRef([]);

  /* ========================================================
     AUDIO
  ======================================================== */

  const [

    audioBlob,

    setAudioBlob,

  ] = useState(null);

  const [

    audioURL,

    setAudioURL,

  ] = useState("");

  const audioPlayer = useRef(null);

  /* ========================================================
     RECORDING TIMER
  ======================================================== */

  const [

    duration,

    setDuration,

  ] = useState(0);

  const timer = useRef(null);

  /* ========================================================
     UPLOAD
  ======================================================== */

  const [

    uploading,

    setUploading,

  ] = useState(false);

  const [

    uploadProgress,

    setUploadProgress,

  ] = useState(0);

  /* ========================================================
     OFFLINE QUEUE
  ======================================================== */

  const [

    offlineQueue,

    setOfflineQueue,

  ] = useState([]);

  /* ========================================================
     ERROR
  ======================================================== */

  const [

    error,

    setError,

  ] = useState("");

  /* ========================================================
     REQUEST MICROPHONE ACCESS
  ======================================================== */

  const requestMicrophone = useCallback(

    async () => {

      try {

        const stream =

          await navigator.mediaDevices.getUserMedia({

            audio: true,

          });

        mediaStream.current = stream;

        return stream;

      }

      catch (err) {

        console.error(

          "Microphone permission denied",

          err

        );

        setError(

          "Microphone access is required to record voice notes."

        );

        return null;

      }

    },

    []

  );

  /* ========================================================
     START TIMER
     (Implementation continues in Part 2)
  ======================================================== */

  const startTimer = useCallback(() => {

    if (timer.current) {

      clearInterval(timer.current);

    }

    timer.current = setInterval(() => {

      setDuration((previous) => {

        if (previous >= MAX_DURATION) {

          return previous;

        }

        return previous + 1;

      });

    }, 1000);

  }, []);

  /* ========================================================
     START RECORDING
  ======================================================== */

  const startRecording = useCallback(

    async () => {

      try {

        setError("");

        setDuration(0);

        chunks.current = [];

        const stream = await requestMicrophone();

        if (!stream) return;

        const recorder = new MediaRecorder(stream);

        mediaRecorder.current = recorder;

        recorder.ondataavailable = (event) => {

          if (event.data.size > 0) {

            chunks.current.push(event.data);

          }

        };

        recorder.onstop = () => {

          const blob = new Blob(

            chunks.current,

            {

              type: "audio/webm",

            }

          );

          setAudioBlob(blob);

          const url = URL.createObjectURL(blob);

          setAudioURL(url);

        };

        recorder.start();

        setRecording(true);

        setPaused(false);

        startTimer();

      }

      catch (err) {

        console.error(

          "Unable to start recording",

          err

        );

        setError(

          "Unable to start recording."

        );

      }

    },

    [

      requestMicrophone,

      startTimer,

    ]

  );

  /* ========================================================
     PAUSE RECORDING
  ======================================================== */

  const pauseRecording = useCallback(() => {

    if (

      mediaRecorder.current &&

      mediaRecorder.current.state === "recording"

    ) {

      mediaRecorder.current.pause();

      setPaused(true);

    }

  }, []);

  /* ========================================================
     RESUME RECORDING
  ======================================================== */

  const resumeRecording = useCallback(() => {

    if (

      mediaRecorder.current &&

      mediaRecorder.current.state === "paused"

    ) {

      mediaRecorder.current.resume();

      setPaused(false);

    }

  }, []);

  /* ========================================================
     STOP RECORDING
  ======================================================== */

  const stopRecording = useCallback(() => {

    if (

      mediaRecorder.current &&

      mediaRecorder.current.state !== "inactive"

    ) {

      mediaRecorder.current.stop();

    }

    if (mediaStream.current) {

      mediaStream.current

        .getTracks()

        .forEach(

          (track) => track.stop()

        );

    }

    if (timer.current) {

      clearInterval(timer.current);

    }

    setRecording(false);

    setPaused(false);

  }, []);

  /* ========================================================
     PLAY VOICE NOTE
  ======================================================== */

  const playRecording = useCallback(() => {

    if (!audioURL) return;

    if (!audioPlayer.current) {

      audioPlayer.current = new Audio(audioURL);

    }

    audioPlayer.current.play();

  }, [

    audioURL,

  ]);

  /* ========================================================
     STOP PLAYBACK
  ======================================================== */

  const stopPlayback = useCallback(() => {

    if (!audioPlayer.current) return;

    audioPlayer.current.pause();

    audioPlayer.current.currentTime = 0;

  }, []);

  /* ========================================================
     DELETE RECORDING
  ======================================================== */

  const deleteRecording = useCallback(() => {

    stopPlayback();

    if (audioURL) {

      URL.revokeObjectURL(audioURL);

    }

    setAudioBlob(null);

    setAudioURL("");

    setDuration(0);

    chunks.current = [];

  }, [

    audioURL,

    stopPlayback,

  ]);

  /* ========================================================
     UPLOAD VOICE NOTE
  ======================================================== */

  const uploadVoiceNote = useCallback(

    async () => {

      if (!audioBlob) return null;

      try {

        setUploading(true);

        setUploadProgress(0);

        setError("");

        const uploadedVoiceNote =

          await voiceNoteService.uploadVoiceNote(

            audioBlob,

            (progress) => {

              setUploadProgress(progress);

            }

          );

        return uploadedVoiceNote;

      }

      catch (err) {

        console.error(

          "Voice note upload failed",

          err

        );

        /**
         * Store for retry when online
         */

        setOfflineQueue((previous) => [

          ...previous,

          audioBlob,

        ]);

        setError(

          err?.message ||

          "Unable to upload voice note."

        );

        return null;

      }

      finally {

        setUploading(false);

        setUploadProgress(0);

      }

    },

    [

      audioBlob,

    ]

  );

  /* ========================================================
     RETRY OFFLINE UPLOADS
  ======================================================== */

  const retryOfflineUploads = useCallback(

    async () => {

      if (!offlineQueue.length) return;

      const queue = [...offlineQueue];

      setOfflineQueue([]);

      for (const blob of queue) {

        try {

          await voiceNoteService.uploadVoiceNote(

            blob

          );

        }

        catch {

          setOfflineQueue((previous) => [

            ...previous,

            blob,

          ]);

        }

      }

    },

    [

      offlineQueue,

    ]

  );

  /* ========================================================
     CLEANUP
  ======================================================== */

  useEffect(() => {

    return () => {

      if (timer.current) {

        clearInterval(timer.current);

      }

      if (audioURL) {

        URL.revokeObjectURL(audioURL);

      }

      if (mediaStream.current) {

        mediaStream.current

          .getTracks()

          .forEach(

            (track) => track.stop()

          );

      }

      if (audioPlayer.current) {

        audioPlayer.current.pause();

        audioPlayer.current = null;

      }

    };

  }, [

    audioURL,

  ]);

  /* ========================================================
     PUBLIC API
  ======================================================== */

  return {

    /* Authentication */

    user,

    hasRole,

    /* Recording */

    recording,

    paused,

    duration,

    /* Audio */

    audioBlob,

    audioURL,

    /* Upload */

    uploading,

    uploadProgress,

    offlineQueue,

    error,

    /* Recording Actions */

    startRecording,

    pauseRecording,

    resumeRecording,

    stopRecording,

    /* Playback */

    playRecording,

    stopPlayback,

    /* Recording Management */

    deleteRecording,

    /* Upload */

    uploadVoiceNote,

    retryOfflineUploads,

  };

};

export default useVoiceNotes;