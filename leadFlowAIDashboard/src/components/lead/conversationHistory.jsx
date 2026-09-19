// Displays the complete conversation timeline between
// the customer and LeadFlow AI.
//
// Data Source:
// conversation.messages
//
// Used inside:
// LeadDetails.jsx
//
// Future upgrades:
// - WhatsApp styling
// - Message timestamps
// - Read receipts
// - AI typing indicator
// - Voice notes
//

const ConversationHistory = ({ conversation }) => {
  const messages = conversation?.messages || [];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
      {/* Header */}

      <div className="border-b border-slate-800 p-5">
        <h2 className="text-lg font-bold text-white">
          Conversation History
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Timeline of customer interactions with LeadFlow AI.
        </p>
      </div>

      {/* Messages */}

      <div className="space-y-4 p-5">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-sm text-slate-400">
              No conversation history available.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCustomer = msg.sender === "customer";

            return (
              <div
                key={index}
                className={`flex ${
                  isCustomer ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isCustomer
                      ? "border border-cyan-500/20 bg-cyan-500/10"
                      : "border border-emerald-500/20 bg-emerald-500/10"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        isCustomer
                          ? "text-cyan-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {isCustomer ? "Customer" : "LeadFlow AI"}
                    </span>

                    {msg.timestamp && (
                      <span className="text-xs text-slate-500">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ConversationHistory;