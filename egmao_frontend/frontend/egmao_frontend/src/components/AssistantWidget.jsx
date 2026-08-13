import { useEffect, useRef, useState } from "react";
import { Drawer, Input, Button, Space, Typography, Avatar, Spin, Tag, Tooltip } from "antd";
import { MessageOutlined, SendOutlined, RobotOutlined, UserOutlined, BulbOutlined, CloseOutlined } from "@ant-design/icons";
import { api } from "../api/client";
import { colors } from "../theme";

/**
 * Modernized Floating "GMAO assistant" Widget
 * Mounted on every authenticated page.
 * Displays initial prompt: "Bonjour, je suis ,GMAO assistant votre assistant IA GMAO."
 */
export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ASSISTANT",
      content:
        "Bonjour, je suis ,GMAO assistant votre assistant IA GMAO. Je suis là pour répondre à vos questions sur les équipements, la maintenance CARL Source, vos parcours de formation ou la gestion GMAO.",
    },
  ]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const send = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || sending) return;
    
    setMessages((prev) => [...prev, { role: "USER", content: text }]);
    if (!textToSend) setInput("");
    setSending(true);

    try {
      const data = await api.assistant.sendMessage({ conversationId, message: text });
      setConversationId(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: "ASSISTANT", content: data.reply, sources: data.sources },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ASSISTANT",
          content:
            "Désolé, je n'arrive pas à me connecter au serveur pour l'instant. " +
            (e.response?.data?.detail || "Veuillez réessayer dans quelques instants."),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const QUICK_QUESTIONS = [
    "Qu'est-ce que CARL Source ?",
    "Comment valider un module ?",
    "Définition d'un Ordre de Travail (OT)",
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <Tooltip title="GMAO assistant" placement="left">
        <button
          onClick={() => setOpen(true)}
          className="gmao-assistant-btn"
          style={{
            position: "fixed",
            right: 32,
            bottom: 32,
            zIndex: 999,
            border: "none",
            cursor: "pointer",
            outline: "none",
          }}
          aria-label="GMAO assistant"
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RobotOutlined style={{ fontSize: 28 }} />
            <BulbOutlined style={{ position: "absolute", top: -6, right: -8, fontSize: 14, color: "#FFD700" }} />
          </div>
        </button>
      </Tooltip>

      {/* Assistant Drawer */}
      <Drawer
        title={null}
        closeIcon={null}
        placement="right"
        width={440}
        open={open}
        onClose={() => setOpen(false)}
        styles={{
          header: { display: "none" },
          body: { display: "flex", flexDirection: "column", padding: 0, background: colors.canvas },
        }}
      >
        {/* Modern Header */}
        <div
          style={{
            padding: "16px 20px",
            background: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              size={40}
              icon={<RobotOutlined />}
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, #F97316 100%)`,
                color: "#FFF",
                boxShadow: "0 2px 8px rgba(231,106,31,0.3)",
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: colors.ink }}>
                GMAO assistant
              </div>
              <div style={{ fontSize: 12, color: colors.success, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: colors.success }} />
                IA ONCF active
              </div>
            </div>
          </div>
          <Button
            type="text"
            shape="circle"
            icon={<CloseOutlined style={{ color: colors.inkSoft }} />}
            onClick={() => setOpen(false)}
          />
        </div>

        {/* Message Container */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {messages.map((m, i) => {
            const isUser = m.role === "USER";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 16,
                  flexDirection: isUser ? "row-reverse" : "row",
                  alignItems: "flex-start",
                }}
              >
                <Avatar
                  size="small"
                  icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                  style={{
                    background: isUser ? colors.ink : colors.primaryActiveBg,
                    color: isUser ? "#FFF" : colors.primary,
                    flexShrink: 0,
                    border: isUser ? "none" : `1px solid ${colors.primaryHover}`,
                  }}
                />
                <div style={{ maxWidth: "82%" }}>
                  <div
                    style={{
                      background: isUser
                        ? colors.primary
                        : colors.surface,
                      color: isUser ? "#FFFFFF" : colors.ink,
                      borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      padding: "12px 16px",
                      boxShadow: isUser
                        ? "0 2px 8px rgba(231, 106, 31, 0.25)"
                        : "0 1px 3px rgba(15, 23, 42, 0.05)",
                      border: isUser ? "none" : `1px solid ${colors.border}`,
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.content}

                    {m.sources?.length > 0 && (
                      <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${colors.border}` }}>
                        <div style={{ fontSize: 11, color: colors.inkMuted, marginBottom: 4, fontWeight: 600 }}>
                          Sources consultées :
                        </div>
                        {m.sources.map((s) => (
                          <Tag key={s.chunk_id} color="orange" style={{ marginBottom: 4, borderRadius: 4, fontSize: 11 }}>
                            {s.document}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {sending && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
              <Avatar
                size="small"
                icon={<RobotOutlined />}
                style={{ background: colors.primaryActiveBg, color: colors.primary }}
              />
              <div style={{ background: colors.surface, padding: "10px 16px", borderRadius: 16, border: `1px solid ${colors.border}` }}>
                <Spin size="small" /> <span style={{ marginLeft: 8, fontSize: 13, color: colors.inkSoft }}>GMAO assistant réfléchit...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length < 4 && !sending && (
          <div style={{ paddingInline: 16, paddingBottom: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {QUICK_QUESTIONS.map((q, idx) => (
              <Button
                key={idx}
                size="small"
                style={{ borderRadius: 12, fontSize: 12, borderColor: colors.border, color: colors.inkSoft }}
                onClick={() => send(q)}
              >
                {q}
              </Button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div style={{ padding: 16, background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder="Posez votre question à GMAO assistant..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={() => send()}
              disabled={sending}
              style={{ borderRadius: "10px 0 0 10px", padding: "8px 12px" }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => send()}
              loading={sending}
              style={{ borderRadius: "0 10px 10px 0", height: 40 }}
            />
          </Space.Compact>
        </div>
      </Drawer>
    </>
  );
}
