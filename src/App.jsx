import { useState, useRef, useEffect } from "react";

// ===================== サンプルデータ =====================
const UNIVERSITIES = [
  {
    name: "慶應義塾大学",
    type: "私立",
    format: "個人面接",
    duration: 15,
    turns: 8,
    adpoli: "リサーチマインドの涵養。研究への強い関心・科学的思考力・国際的視野・独立自尊の精神。",
    emphasis: "研究への興味・科学的問いを立てた経験・論理的思考",
    commonQuestions: [
      "医師を志したきっかけを教えてください。",
      "慶應義塾大学医学部を志望した理由を教えてください。",
      "研究に興味はありますか？どんな分野に興味がありますか？",
      "あなたの長所と短所を教えてください。",
      "チームで何か成し遂げた経験はありますか？",
      "医療の現場で最も大切なことは何だと思いますか？",
      "10年後、どんな医師になっていたいですか？",
    ],
    closingQuestion: "最後に、当学への質問や伝えたいことはありますか？",
  },
  {
    name: "順天堂大学",
    type: "私立",
    format: "個人面接",
    duration: 15,
    turns: 8,
    adpoli: "「仁」の精神と「不断前進」。仁愛・患者への深い思いやり・不断前進の姿勢。",
    emphasis: "仁愛・スポーツ経験・不断前進の精神",
    commonQuestions: [
      "医師を目指したきっかけを教えてください。",
      "順天堂大学を選んだ理由は何ですか？",
      "スポーツや課外活動の経験について教えてください。",
      "困難を乗り越えた経験を教えてください。",
      "患者さんとのコミュニケーションで大切なことは何だと思いますか？",
      "チーム医療についてどう思いますか？",
      "理想の医師像を教えてください。",
    ],
    closingQuestion: "最後に、当学への質問や伝えたいことはありますか？",
  },
  {
    name: "東京大学",
    type: "国公立",
    format: "個人面接",
    duration: 20,
    turns: 10,
    adpoli: "研究的姿勢・批判的思考・知的好奇心を持つ人材の育成。",
    emphasis: "研究・批判的思考・知的好奇心・論理的思考力",
    commonQuestions: [
      "医学を志した動機を教えてください。",
      "東京大学理科三類を選んだ理由は何ですか？",
      "最近興味を持った医療・科学的なトピックはありますか？",
      "研究と臨床、どちらに興味がありますか？",
      "あなたが考える医師の社会的役割とは何ですか？",
      "高校時代に力を入れたことを教えてください。",
      "医療倫理について、どのようなことを考えたことがありますか？",
      "グローバルな医療問題について関心はありますか？",
      "自分の弱点をどう克服しようとしていますか？",
    ],
    closingQuestion: "最後に、東京大学への質問や伝えたいことはありますか？",
  },
  {
    name: "日本大学",
    type: "私立",
    format: "個人面接",
    duration: 10,
    turns: 6,
    adpoli: "「自主創造」の精神。自ら考え創造する姿勢・地域医療・国際医療への関心。",
    emphasis: "自主創造・地域医療への関心・協調性",
    commonQuestions: [
      "医師を志したきっかけを教えてください。",
      "日本大学医学部を志望した理由を教えてください。",
      "地域医療に興味はありますか？",
      "自分で考えて行動した経験を教えてください。",
      "将来どんな医師になりたいですか？",
    ],
    closingQuestion: "最後に、当学への質問や伝えたいことはありますか？",
  },
  {
    name: "大阪大学",
    type: "国公立",
    format: "個人面接",
    duration: 20,
    turns: 10,
    adpoli: "研究型・国際的・革新的医師の育成。",
    emphasis: "研究・国際・革新への意欲・論理的思考",
    commonQuestions: [
      "医師を目指したきっかけを教えてください。",
      "大阪大学を選んだ理由は何ですか？",
      "研究に対する興味・関心を教えてください。",
      "国際的な医療活動に興味はありますか？",
      "チームの中でどんな役割を担うことが多いですか？",
      "医療の課題として何が最も重要だと思いますか？",
      "失敗から学んだ経験を教えてください。",
      "将来どのような医師・研究者になりたいですか？",
      "医療倫理に関して考えたことはありますか？",
    ],
    closingQuestion: "最後に、当学への質問や伝えたいことはありますか？",
  },
];

const API_HEADERS = {
  "Content-Type": "application/json",
  "anthropic-dangerous-direct-browser-access": "true",
  "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
};

// ===================== MAIN APP =====================
export default function App() {
  const [selectedUniv, setSelectedUniv] = useState(null);
  const [phase, setPhase] = useState("select"); // select | interview | done
  const [messages, setMessages] = useState([]); // {role: "interviewer"|"student", text}
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const univ = UNIVERSITIES.find(u => u.name === selectedUniv);

  // 面接開始
  const startInterview = () => {
    if (!univ) return;
    const firstQ = univ.commonQuestions[0];
    setMessages([{ role: "interviewer", text: `本日はお越しいただきありがとうございます。${univ.format}を始めます。よろしくお願いします。\n\n${firstQ}` }]);
    setTurnCount(0);
    setCurrentQuestionIndex(0);
    setFeedback(null);
    setPhase("interview");
  };

  // 回答を送信
  const sendAnswer = async () => {
  if (!input.trim() || loading) return;

  const studentText = input.trim();
  setInput("");
  const newMessages = [...messages, { role: "student", text: studentText }];
  setMessages(newMessages);
  setLoading(true);
  setFeedbackLoading(true);
  setFeedback(null);

  const newTurn = turnCount + 1;
  setTurnCount(newTurn);
  const isLastTurn = newTurn >= univ.turns;

  const interviewerSys = `あなたは${univ.name}医学部の面接官です。
【大学情報】
- アドミッションポリシー: ${univ.adpoli}
- 重視ポイント: ${univ.emphasis}
- 面接形式: ${univ.format}（${univ.duration}分）

【よく聞かれる質問リスト】
${univ.commonQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

【ルール】
- 今まで${newTurn}問答えてもらいました。残り${univ.turns - newTurn}ターンです。
- 学生の回答にツッコミどころ（矛盾・抽象的・根拠が薄い）があれば、深掘りする追加質問をしてください。
- ツッコミどころがなければ、よく聞かれる質問リストから次の質問をしてください（まだ聞いていない質問を優先）。
- ${isLastTurn ? `これが最後の質問です。必ず「${univ.closingQuestion}」と聞いてください。` : "自然な面接の流れを維持してください。"}
- 回答は面接官として1〜2文の質問のみ。前置きや「ありがとうございました」は絶対に言わないでください。終了の挨拶は最後のターン以外禁止。`;

  const feedbackSys = `あなたは医学部面接の専門コーチです。
【大学情報】
- 大学名: ${univ.name}
- アドミッションポリシー: ${univ.adpoli}
- 重視ポイント: ${univ.emphasis}

学生の最新の回答を分析して、以下のJSON形式のみで返してください（コードブロック・説明文不要）:
{
  "score": 0〜100の整数,
  "good_points": ["良かった点を1〜2つ（具体的に）"],
  "improve_points": ["改善点を1〜2つ（具体的に）"],
  "better_answer": "もっと良い回答例（2〜3文）",
  "adpoli_match": 0〜100の整数
}`;

  const interviewerMessages = newMessages.map(m => ({
    role: m.role === "interviewer" ? "assistant" : "user",
    content: m.text,
  }));

  const lastQuestion = messages[messages.length - 1]?.text || "";

  try {
    const [interviewerRes, feedbackRes] = await Promise.all([
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          system: interviewerSys,
          messages: interviewerMessages,
        }),
      }),
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          system: feedbackSys,
          messages: [{
            role: "user",
            content: `質問：${lastQuestion}\n\n学生の回答：${studentText}`,
          }],
        }),
      }),
    ]);

    const [interviewerData, feedbackData] = await Promise.all([
      interviewerRes.json(),
      feedbackRes.json(),
    ]);

    setLoading(false);

    if (interviewerData.error) {
      setMessages(prev => [...prev, { role: "interviewer", text: `エラー: ${interviewerData.error.message}` }]);
      setFeedbackLoading(false);
      return;
    }

    const nextQ = interviewerData.content?.[0]?.text || "次の質問をお願いします。";
    setMessages(prev => [...prev, { role: "interviewer", text: nextQ }]);

    const rawFb = feedbackData.content?.[0]?.text || "";
    try {
      const start = rawFb.indexOf("{");
      const end = rawFb.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(rawFb.slice(start, end + 1));
        setFeedback(parsed);
      }
    } catch {
      setFeedback(null);
    }
    setFeedbackLoading(false);

    if (isLastTurn) {
      setTimeout(() => setPhase("done"), 1000);
    }

  } catch (err) {
    setLoading(false);
    setFeedbackLoading(false);
    setMessages(prev => [...prev, { role: "interviewer", text: "通信エラー: " + err.message }]);
  }
};

  // もう一回チャレンジ（最後の質問に戻る）
  const retryLastQuestion = () => {
    if (messages.length < 2) return;
    // 最後の学生回答と面接官の次の質問を削除
    const trimmed = messages.slice(0, -2);
    setMessages(trimmed.length > 0 ? trimmed : [messages[0]]);
    setTurnCount(prev => Math.max(0, prev - 1));
    setFeedback(null);
    setPhase("interview");
  };

  // リセット
  const resetAll = () => {
    setSelectedUniv(null);
    setPhase("select");
    setMessages([]);
    setFeedback(null);
    setTurnCount(0);
    setInput("");
  };

  const scoreColor = (s) => s >= 80 ? "#059669" : s >= 60 ? "#d97706" : "#dc2626";

  // ===================== UI =====================
  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Noto Sans JP', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .msg-in { animation: fadeIn 0.25s ease; }
        textarea:focus { outline: none; border-color: #2563eb !important; }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#7c3aed,#2563eb)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎤</div>
            <div>
              <div style={{ fontFamily: "serif", fontSize: 18, fontWeight: 700, background: "linear-gradient(135deg,#1e293b,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                医学部 AI面接練習
              </div>
              <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", letterSpacing: ".05em" }}>
                MEDICAL SCHOOL INTERVIEW SIMULATOR
              </div>
            </div>
          </div>
          {phase !== "select" && (
            <button onClick={resetAll} style={{ padding: "7px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              ← 大学選択に戻る
            </button>
          )}
        </div>
      </div>

      {/* 大学選択 */}
      {phase === "select" && (
        <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>練習する大学を選んでください</div>
            <div style={{ fontSize: 14, color: "#64748b" }}>AIが面接官となって本番さながらの練習ができます</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {UNIVERSITIES.map(u => (
              <div key={u.name}
                onClick={() => setSelectedUniv(u.name)}
                style={{
                  background: selectedUniv === u.name ? "rgba(124,58,237,.06)" : "#fff",
                  border: `2px solid ${selectedUniv === u.name ? "#7c3aed" : "#e2e8f0"}`,
                  borderRadius: 14, padding: "20px 22px", cursor: "pointer",
                  transition: "all .15s", boxShadow: "0 1px 6px rgba(0,0,0,.05)"
                }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{u.name}</span>
                  <span style={{ fontSize: 10, fontFamily: "monospace", padding: "2px 7px", borderRadius: 4, background: u.type === "私立" ? "rgba(217,119,6,.1)" : "rgba(8,145,178,.1)", color: u.type === "私立" ? "#b45309" : "#0369a1", border: `0.5px solid ${u.type === "私立" ? "rgba(217,119,6,.3)" : "rgba(8,145,178,.3)"}` }}>
                    {u.type}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                  <span>🕐 {u.duration}分</span>
                  <span>💬 {u.format}</span>
                  <span>❓ 約{u.turns}問</span>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                  重視：{u.emphasis.substring(0, 40)}...
                </div>
              </div>
            ))}
          </div>

          {selectedUniv && (
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button onClick={startInterview}
                style={{ padding: "14px 40px", background: "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(124,58,237,.4)", fontFamily: "inherit" }}>
                🎤 {selectedUniv} の面接練習を始める
              </button>
            </div>
          )}
        </div>
      )}

      {/* 面接画面 */}
      {(phase === "interview" || phase === "done") && univ && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

          {/* 左：チャット */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* 大学情報バー */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{univ.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>🕐 {univ.duration}分 / {univ.format}</div>
              <div style={{ marginLeft: "auto", fontSize: 12, color: "#7c3aed", fontFamily: "monospace" }}>
                {turnCount} / {univ.turns} 問
              </div>
              {/* プログレスバー */}
              <div style={{ width: 100, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(turnCount / univ.turns) * 100}%`, background: "linear-gradient(90deg,#7c3aed,#2563eb)", borderRadius: 3, transition: "width .4s" }} />
              </div>
            </div>

            {/* チャット本体 */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
              <div style={{ height: 460, overflowY: "auto", padding: "20px 20px 10px" }}>
                {messages.map((msg, i) => (
                  <div key={i} className="msg-in" style={{ display: "flex", gap: 10, marginBottom: 16, justifyContent: msg.role === "student" ? "flex-end" : "flex-start" }}>
                    {msg.role === "interviewer" && (
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👨‍⚕️</div>
                    )}
                    <div style={{
                      maxWidth: "75%", padding: "10px 14px", borderRadius: msg.role === "student" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: msg.role === "student" ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "#f8fafc",
                      color: msg.role === "student" ? "#fff" : "#1e293b",
                      fontSize: 13, lineHeight: 1.7,
                      border: msg.role === "interviewer" ? "1px solid #e2e8f0" : "none",
                      whiteSpace: "pre-wrap",
                    }}>
                      {msg.text}
                    </div>
                    {msg.role === "student" && (
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🧑‍🎓</div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👨‍⚕️</div>
                    <div style={{ padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px 14px 14px 4px", display: "flex", gap: 5, alignItems: "center" }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#7c3aed", animation: `spin 1s ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* 入力エリア */}
              {phase === "interview" && (
                <div style={{ borderTop: "1px solid #e2e8f0", padding: "14px 16px", display: "flex", gap: 10 }}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
                    placeholder="回答を入力してください（Enterで送信 / Shift+Enterで改行）"
                    disabled={loading}
                    style={{ flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontFamily: "inherit", lineHeight: 1.6, resize: "none", minHeight: 60, background: loading ? "#f8fafc" : "#fff", color: "#1e293b" }}
                  />
                  <button onClick={sendAnswer} disabled={loading || !input.trim()}
                    style={{ padding: "0 20px", background: loading || !input.trim() ? "#e2e8f0" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", borderRadius: 10, color: loading || !input.trim() ? "#94a3b8" : "#fff", fontSize: 20, cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "all .15s" }}>
                    ↑
                  </button>
                </div>
              )}

              {phase === "done" && (
                <div style={{ borderTop: "1px solid #e2e8f0", padding: "20px", textAlign: "center", background: "#fafbff" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#7c3aed", marginBottom: 6 }}>🎉 面接練習お疲れ様でした！</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>右のフィードバックを参考に復習しましょう。</div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button onClick={retryLastQuestion}
                      style={{ padding: "10px 20px", background: "#fff", border: "2px solid #7c3aed", borderRadius: 10, color: "#7c3aed", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      🔄 最後の質問をもう一回
                    </button>
                    <button onClick={startInterview}
                      style={{ padding: "10px 20px", background: "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      🎤 最初からやり直す
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右：フィードバック */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20 }}>
            {/* 大学アドポリ */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0", fontSize: 11, color: "#64748b", fontFamily: "monospace", letterSpacing: ".07em", textTransform: "uppercase" }}>
                📋 この大学が重視すること
              </div>
              <div style={{ padding: "14px 16px", fontSize: 12, lineHeight: 1.75, color: "#475569" }}>
                <div style={{ fontWeight: 700, color: "#7c3aed", marginBottom: 6, fontSize: 11 }}>⭐ 重視ポイント</div>
                <div style={{ marginBottom: 10 }}>{univ.emphasis}</div>
                <div style={{ fontWeight: 700, color: "#2563eb", marginBottom: 6, fontSize: 11 }}>📄 アドポリ</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{univ.adpoli}</div>
              </div>
            </div>

            {/* フィードバック */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0", fontSize: 11, color: "#64748b", fontFamily: "monospace", letterSpacing: ".07em", textTransform: "uppercase" }}>
                💡 リアルタイムフィードバック
              </div>

              {feedbackLoading && (
                <div style={{ padding: "32px 16px", textAlign: "center" }}>
                  <div style={{ width: 28, height: 28, border: "2px solid #e2e8f0", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 10px" }} />
                  <div style={{ fontSize: 12, color: "#7c3aed", fontFamily: "monospace" }}>分析中...</div>
                </div>
              )}

              {!feedbackLoading && !feedback && (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  回答すると<br />フィードバックが表示されます
                </div>
              )}

              {!feedbackLoading && feedback && (
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* スコア */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, padding: "10px", background: "#fafbff", border: "1px solid #e2e8f0", borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor(feedback.score), fontFamily: "monospace" }}>{feedback.score}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>回答スコア</div>
                    </div>
                    <div style={{ flex: 1, padding: "10px", background: "#fafbff", border: "1px solid #e2e8f0", borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor(feedback.adpoli_match), fontFamily: "monospace" }}>{feedback.adpoli_match}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>アドポリ適合</div>
                    </div>
                  </div>

                  {/* 良かった点 */}
                  {feedback.good_points?.length > 0 && (
                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(5,150,105,.2)" }}>
                      <div style={{ padding: "7px 12px", background: "rgba(5,150,105,.08)", color: "#059669", fontWeight: 700, fontSize: 12, borderBottom: "1px solid rgba(5,150,105,.15)" }}>✅ 良かった点</div>
                      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                        {feedback.good_points.map((p, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>👍 {p}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 改善点 */}
                  {feedback.improve_points?.length > 0 && (
                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(220,38,38,.2)" }}>
                      <div style={{ padding: "7px 12px", background: "rgba(220,38,38,.07)", color: "#dc2626", fontWeight: 700, fontSize: 12, borderBottom: "1px solid rgba(220,38,38,.15)" }}>⚠️ 改善点</div>
                      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                        {feedback.improve_points.map((p, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>🔺 {p}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* より良い回答例 */}
                  {feedback.better_answer && (
                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(124,58,237,.2)" }}>
                      <div style={{ padding: "7px 12px", background: "rgba(124,58,237,.07)", color: "#7c3aed", fontWeight: 700, fontSize: 12, borderBottom: "1px solid rgba(124,58,237,.15)" }}>✨ より良い回答例</div>
                      <div style={{ padding: "10px 12px", fontSize: 12, color: "#475569", lineHeight: 1.75 }}>
                        {feedback.better_answer}
                      </div>
                    </div>
                  )}

                  {/* もう一回ボタン */}
                  <button onClick={retryLastQuestion}
                    style={{ width: "100%", padding: "10px", background: "#fff", border: "2px solid #7c3aed", borderRadius: 9, color: "#7c3aed", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                    🔄 もう一回チャレンジ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}