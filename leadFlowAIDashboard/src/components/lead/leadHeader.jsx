/**
 * Displays the primary identity of a Lead.
 *
 * This is the first section agents see when opening:
 *
 *      /lead/:id
 *
 * It highlights:
 * • Customer Name
 * • Phone Number
 * • Lead Status
 * • AI Lead Score
 *
 * It also provides quick communication actions:
 * • Call Lead
 * • WhatsApp Lead
 * • SMS Lead
 *
 * This acts as the identity banner.
 * ==========================================================
 */

const LeadHeader = ({ lead }) => {
  if (!lead) return null;

  const phone = lead.phone || "";

  const whatsappUrl = `https://wa.me/${phone}`;
  const smsUrl = `sms:${phone}`;
  const callUrl = `tel:${phone}`;

  return (
    <section
      className="
        rounded-2xl
        border
        border-slate-800
        bg-slate-900
        p-6
        shadow-xl
      "
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

        {/* Left */}

        <div>
          <h1
            className="
              text-3xl
              font-bold
              text-white
            "
          >
            {lead.name}
          </h1>

          <p
            className="
              mt-2
              text-slate-400
            "
          >
            📞 {phone || "No phone available"}
          </p>

          {/* Communication Actions */}

          {phone && (
            <div className="mt-5 flex flex-wrap gap-3">

              <a
                href={callUrl}
                className="
                  rounded-lg
                  bg-cyan-500
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-950
                  transition
                  hover:bg-cyan-400
                "
              >
                📞 Call Lead
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  rounded-lg
                  bg-emerald-500
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-950
                  transition
                  hover:bg-emerald-400
                "
              >
                💬 WhatsApp Lead
              </a>

              <a
                href={smsUrl}
                className="
                  rounded-lg
                  bg-indigo-500
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-indigo-400
                "
              >
                ✉️ SMS Lead
              </a>

            </div>
          )}
        </div>

        {/* Right */}

        <div className="flex items-center gap-4">

          {/* Status */}

          <div
            className="
              rounded-full
              border
              border-cyan-500/30
              bg-cyan-500/10
              px-4
              py-2
              text-sm
              font-semibold
              text-cyan-400
            "
          >
            {lead.status?.toUpperCase()}
          </div>

          {/* Score */}

          <div
            className="
              rounded-full
              border
              border-orange-500/30
              bg-orange-500/10
              px-4
              py-2
              text-sm
              font-bold
              text-orange-400
            "
          >
            AI Score: {lead.score}
          </div>

        </div>

      </div>
    </section>
  );
};

export default LeadHeader;
