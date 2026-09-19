/**
 * Africa's Talking Service Layer (LeadFlow AI)
 * - Handles SMS sending only
 * - Uses centralized AT config
 * - No SDK initialization here (IMPORTANT)
 */

import { sendSMS as atSendSMS } from "../config/at.js";
import { normalizeKenyanNumber } from "../utils/phoneUtils.js";

/**
 * Send message wrapper (service layer)
 */
export const sendMessage = async (cleanPhone, message) => {
  return await atSendSMS(cleanPhone, message);
};

/**
 * Debug + safe SMS sender (NO recursion)
 */
export const sendSMS = async (phone, message) => {
  try {
    const cleanPhone = normalizeKenyanNumber(phone);

    if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error("Invalid phone number format");
  }
    console.log("📨 sendSMS input check:", {
      phone: cleanPhone,
      message,
      phoneType: typeof phone,
      messageType: typeof message,
    });

    const result = await atSendSMS(cleanPhone, message);

    return result;
  } catch (error) {
    console.error("❌ Africa's Talking SMS error:", error);
    throw error;
  }
};