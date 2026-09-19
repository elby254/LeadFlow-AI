// ======================================================
// Agent Time Slot Schema
// ======================================================

import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
  {
    // ==================================================
    // RELATIONSHIPS
    // ==================================================

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Optional if already booked
    viewing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Viewing",
      default: null,
    },

    // ==================================================
    // DATE
    // ==================================================

    date: {
      type: Date,
      required: true,
      index: true,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    timezone: {
      type: String,
      default: "Africa/Nairobi",
    },

    durationMinutes: {
      type: Number,
      default: 60,
    },

    // ==================================================
    // STATUS
    // ==================================================

    status: {
      type: String,
      enum: [
        "Available",
        "Reserved",
        "Booked",
        "Blocked",
        "Completed",
        "Cancelled",
      ],
      default: "Available",
      index: true,
    },

    // ==================================================
    // BOOKING INFO
    // ==================================================

    reservedUntil: {
      type: Date,
      default: null,
    },

    bookedAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // LOCATION
    // ==================================================

    officeBranch: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      address: {
        type: String,
        trim: true,
        default: "",
      },

      latitude: Number,

      longitude: Number,
    },

    // ==================================================
    // SYSTEM FLAGS
    // ==================================================

    isRecurring: {
      type: Boolean,
      default: false,
    },

    recurringRule: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// INDEXES
// ======================================================

timeSlotSchema.index({
  agent: 1,
  date: 1,
});

timeSlotSchema.index({
  date: 1,
  status: 1,
});

timeSlotSchema.index({
  viewing: 1,
});

timeSlotSchema.index(
  {
    agent: 1,
    date: 1,
    startTime: 1,
  },
  {
    unique: true,
  }
);

const TimeSlot = mongoose.model(
  "TimeSlot",
  timeSlotSchema
);

export default TimeSlot;