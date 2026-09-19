export const normalizeKenyanNumber = (phone) => {
  if (!phone) return null;

  phone = phone.replace(/\s/g, "");

  if (phone.startsWith("0")) {
    phone = "254" + phone.substring(1);
  }

  if (!phone.startsWith("+")) {
    phone = "+" + phone;
  }

  return phone;
};