import { useState, useRef, useEffect } from "react";

// ── カラー定数 ──────────────────────────────
const C = {
  orange: "#F58220",
  gold: "#a68d60",
  goldDark: "#8f7950",
  red: "#EF413D",
  text: "#333333",
  sub: "#494949",
  muted: "#666666",
  light: "#999999",
  bg: "#ffffff",
  bgGray: "#f5f5f5",
  bgCard: "#fafafa",
  bgOrange: "#FFF8F0",
  border: "#e8e8e8",
};

const UNIVERSITIES = [
  {
    name: "慶應義塾大学", type: "私立", format: "個人面接", duration: 15, turns: 8,
    adpoli: "リサーチマインドの涵養。研究への強い関心・科学的思考力・国際的視野・独立自尊の精神。",
    emphasis: "研究への興味・科学的問いを立てた経験・論理的思考",
    commonQuestions: ["医師を志したきっかけを教えてください。","慶應義塾大学医学部を志望した理由を教えてください。","研究に興味はありますか？どんな分野に興味がありますか？","あなたの長所と短所を教えてください。","チームで何か成し遂げた経験はありますか？","医療の現場で最も大切なことは何だと思いますか？","10年後、どんな医師になっていたいですか？"],
    closingQuestion: "最後に、当学への質問や伝えたいことはありますか？",
  },
  {
    name: "順天堂大学", type: "私立", format: "個人面接", duration: 15, turns: 8,
    adpoli: "「仁」の精神と「不断前進」。仁愛・患者への深い思いやり・不断前進の姿勢。",
    emphasis: "仁愛・スポーツ経験・不断前進の精神",
    commonQuestions: ["医師を目指したきっかけを教えてください。","順天堂大学を選んだ理由は何ですか？","スポーツや課外活動の経験について教えてください。","困難を乗り越えた経験を教えてください。","患者さんとのコミュニケーションで大切なことは何だと思いますか？","チーム医療についてどう思いますか？","理想の医師像を教えてください。"],
    closingQuestion: "最後に、当学への質問や伝えたいことはありますか？",
  },
  {
    name: "東京大学", type: "国公立", format: "個人面接", duration: 20, turns: 10,
    adpoli: "研究的姿勢・批判的思考・知的好奇心を持つ人材の育成。",
    emphasis: "研究・批判的思考・知的好奇心・論理的思考力",
    commonQuestions: ["医学を志した動機を教えてください。","東京大学理科三類を選んだ理由は何ですか？","最近興味を持った医療・科学的なトピックはありますか？","研究と臨床、どちらに興味がありますか？","あなたが考える医師の社会的役割とは何ですか？","高校時代に力を入れたことを教えてください。","医療倫理について、どのようなことを考えたことがありますか？","グローバルな医療問題について関心はありますか？","自分の弱点をどう克服しようとしていますか？"],
    closingQuestion: "最後に、東京大学への質問や伝えたいことはありますか？",
  },
  {
    name: "日本大学", type: "私立", format: "個人面接", duration: 10, turns: 6,
    adpoli: "「自主創造」の精神。自ら考え創造する姿勢・地域医療・国際医療への関心。",
    emphasis: "自主創造・地域医療への関心・協調性",
    commonQuestions: ["医師を志したきっかけを教えてください。","日本大学医学部を志望した理由を教えてください。","地域医療に興味はありますか？","自分で考えて行動した経験を教えてください。","将来どんな医師になりたいですか？"],
    closingQuestion: "最後に、当学への質問や伝えたいことはありますか？",
  },
  {
    name: "大阪大学", type: "国公立", format: "個人面接", duration: 20, turns: 10,
    adpoli: "研究型・国際的・革新的医師の育成。",
    emphasis: "研究・国際・革新への意欲・論理的思考",
    commonQuestions: ["医師を目指したきっかけを教えてください。","大阪大学を選んだ理由は何ですか？","研究に対する興味・関心を教えてください。","国際的な医療活動に興味はありますか？","チームの中でどんな役割を担うことが多いですか？","医療の課題として何が最も重要だと思いますか？","失敗から学んだ経験を教えてください。","将来どのような医師・研究者になりたいですか？","医療倫理に関して考えたことはありますか？"],
    closingQuestion: "最後に、当学への質問や伝えたいことはありますか？",
  },
];

const API_HEADERS = {
  "Content-Type": "application/json",
  "anthropic-dangerous-direct-browser-access": "true",
  "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
};

const downloadPDF = async (univ, messages, allFeedbacks) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const date = new Date().toLocaleDateString("ja-JP");
  const avgScore = allFeedbacks.length > 0 ? Math.round(allFeedbacks.reduce((s, f) => s + (f.score || 0), 0) / allFeedbacks.length) : 0;
  const avgAdpoli = allFeedbacks.length > 0 ? Math.round(allFeedbacks.reduce((s, f) => s + (f.adpoli_match || 0), 0) / allFeedbacks.length) : 0;
  const pairs = [];
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === "interviewer" && messages[i + 1]?.role === "student") {
      pairs.push({ q: messages[i].text, a: messages[i + 1].text, fb: allFeedbacks[pairs.length] || null });
    }
  }
  const pageW = 210; const margin = 18; const contentW = pageW - margin * 2; let y = margin;
  const checkPage = (needed = 10) => { if (y + needed > 277) { doc.addPage(); y = margin; } };
  const text = (str, x, size = 10, color = [30, 41, 59], bold = false) => {
    doc.setFontSize(size); doc.setTextColor(...color); doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(String(str), contentW - (x - margin));
    checkPage(lines.length * (size * 0.45 + 1)); doc.text(lines, x, y);
    y += lines.length * (size * 0.45 + 1) + 1;
  };
  doc.setFillColor(245, 130, 32); doc.rect(0, 0, 210, 22, "F");
  doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
  doc.text("Medical School Interview Report", margin, 10);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(`${univ.name} / ${univ.format} ${univ.duration}min / ${date}`, margin, 17); y = 28;
  const bw = (contentW - 8) / 3;
  [{ label: "Avg Score", val: avgScore }, { label: "Adpoli Match", val: avgAdpoli }, { label: "Questions", val: allFeedbacks.length }].forEach((sb, i) => {
    const bx = margin + i * (bw + 4);
    doc.setFillColor(255, 248, 240); doc.setDrawColor(245, 130, 32); doc.roundedRect(bx, y, bw, 20, 2, 2, "FD");
    doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(245, 130, 32);
    doc.text(String(sb.val), bx + bw / 2, y + 11, { align: "center" });
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    doc.text(sb.label, bx + bw / 2, y + 17, { align: "center" });
  }); y += 26;
  doc.setFillColor(255, 248, 240); doc.setDrawColor(245, 130, 32); doc.roundedRect(margin, y, contentW, 14, 2, 2, "FD"); y += 4;
  text(`AdPoli: ${univ.adpoli}`, margin + 3, 8, [100, 116, 139]); y += 4;
  pairs.forEach((pair, i) => {
    checkPage(30); y += 4;
    doc.setFillColor(245, 130, 32); doc.roundedRect(margin, y, contentW, 7, 1, 1, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text(`Q${i + 1}`, margin + 3, y + 5);
    if (pair.fb) doc.text(`Score: ${pair.fb.score}  Adpoli: ${pair.fb.adpoli_match}`, margin + contentW - 3, y + 5, { align: "right" });
    y += 9;
    text(`[Q] ${pair.q.replace(/\n/g, " ")}`, margin + 2, 9, [71, 85, 105], true); y += 1;
    text(`[A] ${pair.a.replace(/\n/g, " ")}`, margin + 2, 9, [30, 41, 59]); y += 1;
    if (pair.fb) {
      if (pair.fb.good_points?.length > 0) { doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(5, 150, 105); checkPage(6); doc.text("Good: " + pair.fb.good_points[0], margin + 2, y); y += 5; }
      if (pair.fb.improve_points?.length > 0) { doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(239, 65, 61); checkPage(6); doc.text("Improve: " + pair.fb.improve_points[0], margin + 2, y); y += 5; }
      if (pair.fb.better_answer) text(`Better: ${pair.fb.better_answer}`, margin + 2, 8.5, [166, 141, 96]);
    }
    doc.setDrawColor(226, 232, 240); doc.line(margin, y + 1, margin + contentW, y + 1); y += 4;
  });
  doc.save(`面接練習レポート_${univ.name}_${date.replace(/\//g, "-")}.pdf`);
};

// スマホ用スコアモーダル
function ScoreModal({ feedback, allFeedbacks, univ, onClose }) {
  const avgScore = allFeedbacks.length > 0 ? Math.round(allFeedbacks.reduce((s, f) => s + (f.score || 0), 0) / allFeedbacks.length) : 0;
  const avgAdpoli = allFeedbacks.length > 0 ? Math.round(allFeedbacks.reduce((s, f) => s + (f.adpoli_match || 0), 0) / allFeedbacks.length) : 0;
  const scoreColor = (s) => s >= 75 ? "#059669" : s >= 55 ? C.orange : C.red;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "80vh", overflowY: "auto", paddingBottom: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2 }} />
        </div>
        <div style={{ padding: "0 20px" }}>
          {allFeedbacks.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(avgScore), fontFamily: "monospace" }}>{avgScore}</div>
                <div style={{ fontSize: 11, color: C.muted }}>平均スコア</div>
              </div>
              <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(avgAdpoli), fontFamily: "monospace" }}>{avgAdpoli}</div>
                <div style={{ fontSize: 11, color: C.muted }}>アドポリ適合</div>
              </div>
            </div>
          )}
          {feedback && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>最新フィードバック</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: 12, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor(feedback.score), fontFamily: "monospace" }}>{feedback.score}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>回答スコア</div>
                </div>
                <div style={{ padding: 12, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor(feedback.adpoli_match), fontFamily: "monospace" }}>{feedback.adpoli_match}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>アドポリ適合</div>
                </div>
              </div>
              {feedback.good_points?.length > 0 && (
                <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(5,150,105,.2)" }}>
                  <div style={{ padding: "7px 12px", background: "rgba(5,150,105,.08)", color: "#059669", fontWeight: 700, fontSize: 12 }}>✅ 良かった点</div>
                  <div style={{ padding: "10px 12px" }}>{feedback.good_points.map((p, i) => <div key={i} style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>👍 {p}</div>)}</div>
                </div>
              )}
              {feedback.improve_points?.length > 0 && (
                <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid rgba(239,65,61,.2)` }}>
                  <div style={{ padding: "7px 12px", background: "rgba(239,65,61,.07)", color: C.red, fontWeight: 700, fontSize: 12 }}>⚠️ 改善点</div>
                  <div style={{ padding: "10px 12px" }}>{feedback.improve_points.map((p, i) => <div key={i} style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>🔺 {p}</div>)}</div>
                </div>
              )}
              {feedback.better_answer && (
                <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid rgba(166,141,96,.2)` }}>
                  <div style={{ padding: "7px 12px", background: "rgba(166,141,96,.07)", color: C.gold, fontWeight: 700, fontSize: 12 }}>✨ より良い回答例</div>
                  <div style={{ padding: "10px 12px", fontSize: 12, color: C.sub, lineHeight: 1.75 }}>{feedback.better_answer}</div>
                </div>
              )}
            </div>
          )}
          {univ && (
            <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 6 }}>⭐ 重視ポイント</div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 10, lineHeight: 1.6 }}>{univ.emphasis}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 6 }}>📄 アドポリ</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>{univ.adpoli}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 残り時間表示コンポーネント
function TimerDisplay({ secondsLeft, totalSeconds }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const pct = secondsLeft / totalSeconds;
  const color = pct > 0.5 ? "#059669" : pct > 0.25 ? C.orange : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 60, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: color, borderRadius: 3, transition: "width 1s linear" }} />
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color, minWidth: 40 }}>
        {mins}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function App() {
  const [selectedUniv, setSelectedUniv] = useState(null);
  const [phase, setPhase] = useState("select"); // select → mode → interview → done
  const [modeChoice, setModeChoice] = useState(null); // "time" | "turns"
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // タイマー管理
  useEffect(() => {
    if (phase === "interview" && modeChoice === "time" && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setPhase("done");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, modeChoice]);

  const univ = UNIVERSITIES.find(u => u.name === selectedUniv);

  const startInterview = () => {
    if (!univ) return;
    clearInterval(timerRef.current);
    if (modeChoice === "time") {
      setSecondsLeft(univ.duration * 60);
    }
    setMessages([{ role: "interviewer", text: `本日はお越しいただきありがとうございます。${univ.format}を始めます。よろしくお願いします。\n\n${univ.commonQuestions[0]}` }]);
    setTurnCount(0); setFeedback(null); setAllFeedbacks([]); setShowSummary(false); setPhase("interview");
  };

  const sendAnswer = async () => {
    if (!input.trim() || loading) return;
    const studentText = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "student", text: studentText }];
    setMessages(newMessages); setLoading(true); setFeedbackLoading(true); setFeedback(null);
    const newTurn = turnCount + 1; setTurnCount(newTurn);
    const isLastTurn = modeChoice === "turns" && newTurn >= univ.turns;
    const timeRemaining = modeChoice === "time" ? `残り時間: ${Math.floor(secondsLeft / 60)}分${secondsLeft % 60}秒` : "";

    const interviewerSys = `あなたは${univ.name}医学部の面接官です。
【大学情報】
- アドミッションポリシー: ${univ.adpoli}
- 重視ポイント: ${univ.emphasis}
- 面接形式: ${univ.format}（${univ.duration}分）
【よく聞かれる質問リスト】
${univ.commonQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}
【厳守ルール】
- 今まで${newTurn}問答えてもらいました。${modeChoice === "turns" ? `残り${univ.turns - newTurn}ターンです。` : timeRemaining}
- 学生の回答にツッコミどころ（矛盾・抽象的・根拠が薄い）があれば深掘りする追加質問をしてください。
- ツッコミどころがなければよく聞かれる質問リストから次の未回答の質問をしてください。
- ${isLastTurn ? `これが最後の質問です。必ず「${univ.closingQuestion}」と聞いてください。` : ""}
- ${modeChoice === "time" && secondsLeft < 120 ? `残り時間が少ないです。「${univ.closingQuestion}」で締めてください。` : ""}
- 出力は面接官の質問文のみ（1〜2文）。終了の挨拶は最後のターン以外絶対禁止。`;

    const feedbackSys = `あなたは医学部面接の専門コーチです。
【大学情報】
- 大学名: ${univ.name}
- アドミッションポリシー: ${univ.adpoli}
- 重視ポイント: ${univ.emphasis}
以下のJSON形式のみで返してください（コードブロック・説明文不要）:
{"score":0〜100の整数,"good_points":["良かった点1〜2つ"],"improve_points":["改善点1〜2つ"],"better_answer":"より良い回答例2〜3文","adpoli_match":0〜100の整数}`;

    const interviewerMessages = newMessages.map(m => ({ role: m.role === "interviewer" ? "assistant" : "user", content: m.text }));
    const lastQuestion = messages[messages.length - 1]?.text || "";
    try {
      const [interviewerRes, feedbackRes] = await Promise.all([
        fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: API_HEADERS, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 300, system: interviewerSys, messages: interviewerMessages }) }),
        fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: API_HEADERS, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 800, system: feedbackSys, messages: [{ role: "user", content: `質問：${lastQuestion}\n\n学生の回答：${studentText}` }] }) }),
      ]);
      const [interviewerData, feedbackData] = await Promise.all([interviewerRes.json(), feedbackRes.json()]);
      setLoading(false);
      if (interviewerData.error) { setMessages(prev => [...prev, { role: "interviewer", text: `エラー: ${interviewerData.error.message}` }]); setFeedbackLoading(false); return; }
      const nextQ = interviewerData.content?.[0]?.text || "次の質問をお願いします。";
      setMessages(prev => [...prev, { role: "interviewer", text: nextQ }]);
      const rawFb = feedbackData.content?.[0]?.text || "";
      let parsedFb = null;
      try { const start = rawFb.indexOf("{"); const end = rawFb.lastIndexOf("}"); if (start !== -1 && end !== -1) parsedFb = JSON.parse(rawFb.slice(start, end + 1)); } catch { parsedFb = null; }
      if (parsedFb) { parsedFb._question = lastQuestion; parsedFb._answer = studentText; setFeedback(parsedFb); setAllFeedbacks(prev => [...prev, parsedFb]); }
      setFeedbackLoading(false);
      if (isLastTurn) setTimeout(() => setPhase("done"), 1000);
    } catch (err) {
      setLoading(false); setFeedbackLoading(false);
      setMessages(prev => [...prev, { role: "interviewer", text: "通信エラー: " + err.message }]);
    }
  };

  const retryLastQuestion = () => {
    if (messages.length < 2) return;
    const trimmed = messages.slice(0, -2);
    setMessages(trimmed.length > 0 ? trimmed : [messages[0]]);
    setTurnCount(prev => Math.max(0, prev - 1));
    setFeedback(null); setAllFeedbacks(prev => prev.slice(0, -1)); setPhase("interview");
  };

  const resetAll = () => {
    clearInterval(timerRef.current);
    setSelectedUniv(null); setPhase("select"); setMessages([]);
    setFeedback(null); setAllFeedbacks([]); setTurnCount(0); setInput(""); setShowSummary(false); setModeChoice(null); setSecondsLeft(0);
  };

  const scoreColor = (s) => s >= 75 ? "#059669" : s >= 55 ? C.orange : C.red;
  const avgScore = allFeedbacks.length > 0 ? Math.round(allFeedbacks.reduce((s, f) => s + (f.score || 0), 0) / allFeedbacks.length) : 0;
  const avgAdpoli = allFeedbacks.length > 0 ? Math.round(allFeedbacks.reduce((s, f) => s + (f.adpoli_match || 0), 0) / allFeedbacks.length) : 0;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", color: C.text }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .msg-in { animation: fadeIn 0.25s ease; }
        textarea:focus { outline: none; border-color: ${C.orange} !important; box-shadow: 0 0 0 2px rgba(245,130,32,0.15) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        @media (max-width: 768px) {
          .interview-grid { grid-template-columns: 1fr !important; }
          .feedback-panel { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: "16px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, background: C.orange, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎤</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.text, letterSpacing: 1 }}>医学部 AI面接練習</div>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: ".05em" }}>MEDICAL SCHOOL INTERVIEW SIMULATOR</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* 時間制タイマー */}
            {(phase === "interview" || phase === "done") && modeChoice === "time" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  fontFamily: "monospace", fontSize: 22, fontWeight: 900, lineHeight: 1,
                  color: secondsLeft / (univ?.duration * 60) > 0.5 ? "#059669"
                       : secondsLeft / (univ?.duration * 60) > 0.25 ? C.orange
                       : C.red,
                }}>
                  {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                </div>
                <div style={{ width: 60, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 2, transition: "width 1s linear",
                    width: `${(secondsLeft / (univ?.duration * 60)) * 100}%`,
                    background: secondsLeft / (univ?.duration * 60) > 0.5 ? "#059669"
                              : secondsLeft / (univ?.duration * 60) > 0.25 ? C.orange
                              : C.red,
                  }} />
                </div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.05em" }}>残り時間</div>
              </div>
            )}
            {(phase === "interview" || phase === "done") && (
              <button onClick={() => setScoreModalOpen(true)}
                style={{ width: 72, height: 72, borderRadius: "50%", background: avgScore >= 75 ? "#059669" : avgScore >= 55 ? C.orange : C.red, border: "none", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", transition: "transform 0.15s", flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{avgScore}</span>
                <span style={{ fontSize: 10, opacity: 0.9, lineHeight: 1.4 }}>総合スコア</span>
              </button>
            )}
            {phase === "done" && (
              <button onClick={() => setShowSummary(!showSummary)}
                style={{ padding: "8px 16px", background: C.orange, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
                📊 まとめを見る
              </button>
            )}
            {phase !== "select" && phase !== "mode" && (
              <button onClick={resetAll}
                style={{ padding: "8px 16px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, cursor: "pointer" }}>
                ← 最初に戻る
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 大学選択 */}
      {phase === "select" && (
        <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 8 }}>練習する大学を選んでください</div>
            <div style={{ fontSize: 14, color: C.muted }}>AIが面接官となって本番さながらの練習ができます</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {UNIVERSITIES.map(u => (
              <div key={u.name} onClick={() => setSelectedUniv(u.name)}
                style={{ background: selectedUniv === u.name ? C.bgOrange : C.bg, border: `2px solid ${selectedUniv === u.name ? C.orange : C.border}`, borderRadius: 10, padding: "20px 22px", cursor: "pointer", transition: "all .15s", boxShadow: selectedUniv === u.name ? `0 0 0 1px ${C.orange}` : "0 1px 6px rgba(0,0,0,.05)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{u.name}</span>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: u.type === "私立" ? "rgba(245,130,32,.1)" : "rgba(166,141,96,.1)", color: u.type === "私立" ? C.orange : C.gold, fontWeight: 700 }}>{u.type}</span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.muted, marginBottom: 10 }}>
                  <span>🕐 {u.duration}分</span><span>💬 {u.format}</span><span>❓ 約{u.turns}問</span>
                </div>
                <div style={{ fontSize: 11, color: C.light, lineHeight: 1.6 }}>重視：{u.emphasis.substring(0, 40)}...</div>
              </div>
            ))}
          </div>
          {selectedUniv && (
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button onClick={() => setPhase("mode")}
                style={{ padding: "14px 40px", background: C.orange, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px rgba(245,130,32,.4)` }}>
                次へ → 練習モードを選ぶ
              </button>
            </div>
          )}
        </div>
      )}

      {/* モード選択 */}
      {phase === "mode" && univ && (
        <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 8 }}>{univ.name}</div>
            <div style={{ fontSize: 14, color: C.muted }}>練習モードを選んでください</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
            {/* 時間制 */}
            <div onClick={() => setModeChoice("time")}
              style={{ background: modeChoice === "time" ? C.bgOrange : C.bg, border: `2px solid ${modeChoice === "time" ? C.orange : C.border}`, borderRadius: 10, padding: 28, cursor: "pointer", textAlign: "center", transition: "all .15s", boxShadow: modeChoice === "time" ? `0 0 0 1px ${C.orange}` : "none" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏱</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>時間制</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>本番と同じ{univ.duration}分間で練習。残り時間をカウントダウン表示。</div>
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: C.orange }}>{univ.duration}分間</div>
            </div>
            {/* 往復制 */}
            <div onClick={() => setModeChoice("turns")}
              style={{ background: modeChoice === "turns" ? C.bgOrange : C.bg, border: `2px solid ${modeChoice === "turns" ? C.orange : C.border}`, borderRadius: 10, padding: 28, cursor: "pointer", textAlign: "center", transition: "all .15s", boxShadow: modeChoice === "turns" ? `0 0 0 1px ${C.orange}` : "none" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>往復制</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>質問と回答の往復回数で練習。じっくり考えながら取り組める。</div>
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: C.gold }}>約{univ.turns}往復</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => setPhase("select")}
              style={{ padding: "12px 24px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, fontSize: 14, cursor: "pointer" }}>
              ← 戻る
            </button>
            {modeChoice && (
              <button onClick={startInterview}
                style={{ padding: "12px 32px", background: C.orange, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px rgba(245,130,32,.4)` }}>
                🎤 面接練習スタート！
              </button>
            )}
          </div>
        </div>
      )}

      {/* まとめモーダル */}
      {showSummary && phase === "done" && univ && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowSummary(false)}>
          <div style={{ background: C.bg, borderRadius: 20, maxWidth: 720, width: "100%", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: C.text }}>📊 面接練習まとめ — {univ.name}</div>
              <button onClick={() => setShowSummary(false)} style={{ padding: "6px 12px", border: `1px solid ${C.border}`, borderRadius: 7, background: C.bg, cursor: "pointer", fontSize: 13, color: C.muted }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[{ label: "平均回答スコア", val: avgScore, icon: "🎯" }, { label: "平均アドポリ適合", val: avgAdpoli, icon: "📋" }, { label: "回答問数", val: allFeedbacks.length, icon: "💬" }].map(({ label, val, icon }) => (
                  <div key={label} style={{ padding: 16, border: `1px solid ${C.border}`, borderRadius: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(val), fontFamily: "monospace" }}>{val}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {allFeedbacks.map((fb, i) => (
                  <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "8px 16px", background: C.bgOrange, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: C.orange }}>Q{i + 1}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "rgba(245,130,32,.1)", color: C.orange }}>スコア: {fb.score}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "rgba(166,141,96,.1)", color: C.gold }}>適合: {fb.adpoli_match}</span>
                      </div>
                    </div>
                    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {fb._question && <div style={{ fontSize: 12, color: C.muted, background: C.bgGray, padding: "6px 10px", borderRadius: 6 }}>❓ {fb._question.substring(0, 80)}{fb._question.length > 80 ? "..." : ""}</div>}
                      {fb._answer && <div style={{ fontSize: 12, color: C.text, padding: "6px 10px", background: C.bgOrange, borderRadius: 6 }}>💬 {fb._answer.substring(0, 100)}{fb._answer.length > 100 ? "..." : ""}</div>}
                      {fb.good_points?.length > 0 && <div style={{ fontSize: 12, color: "#059669" }}>✅ {fb.good_points[0]}</div>}
                      {fb.improve_points?.length > 0 && <div style={{ fontSize: 12, color: C.red }}>⚠️ {fb.improve_points[0]}</div>}
                      {fb.better_answer && <div style={{ fontSize: 12, color: C.gold, padding: "6px 10px", background: "rgba(166,141,96,.06)", borderRadius: 6 }}>✨ {fb.better_answer}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", paddingTop: 8, flexWrap: "wrap" }}>
                <button onClick={() => downloadPDF(univ, messages, allFeedbacks)}
                  style={{ padding: "12px 28px", background: C.orange, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  📄 PDFレポートをダウンロード
                </button>
                <button onClick={startInterview}
                  style={{ padding: "12px 24px", background: C.bg, border: `2px solid ${C.gold}`, borderRadius: 10, color: C.gold, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  🔄 もう一度練習する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 面接画面 */}
      {(phase === "interview" || phase === "done") && univ && (
        <div className="interview-grid" style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* 進捗バー */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,.05)", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{univ.name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>🕐 {univ.format}</div>
              {modeChoice === "turns" ? (
                <>
                  <div style={{ marginLeft: "auto", fontSize: 12, color: C.orange, fontFamily: "monospace" }}>{turnCount} / {univ.turns} 問</div>
                  <div style={{ width: 80, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(turnCount / univ.turns) * 100}%`, background: C.orange, borderRadius: 3, transition: "width .4s" }} />
                  </div>
                </>
              ) : (
                <div style={{ marginLeft: "auto" }}>
                  <TimerDisplay secondsLeft={secondsLeft} totalSeconds={univ.duration * 60} />
                </div>
              )}
            </div>

            {/* チャット */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
              <div style={{ height: 460, overflowY: "auto", padding: "20px 20px 10px" }}>
                {messages.map((msg, i) => (
                  <div key={i} className="msg-in" style={{ display: "flex", gap: 10, marginBottom: 16, justifyContent: msg.role === "student" ? "flex-end" : "flex-start" }}>
                    {msg.role === "interviewer" && <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👨‍⚕️</div>}
                    <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: msg.role === "student" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: msg.role === "student" ? C.orange : C.bgGray, color: msg.role === "student" ? "#fff" : C.text, fontSize: 13, lineHeight: 1.7, border: msg.role === "interviewer" ? `1px solid ${C.border}` : "none", whiteSpace: "pre-wrap" }}>
                      {msg.text}
                    </div>
                    {msg.role === "student" && <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.bgOrange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🧑‍🎓</div>}
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👨‍⚕️</div>
                    <div style={{ padding: "12px 16px", background: C.bgGray, border: `1px solid ${C.border}`, borderRadius: "14px 14px 14px 4px", display: "flex", gap: 5, alignItems: "center" }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.orange, animation: `spin 1s ${i * 0.2}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {phase === "interview" && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", gap: 10 }}>
                  <textarea value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
                    placeholder="回答を入力してください（Enterで送信 / Shift+Enterで改行）"
                    disabled={loading}
                    style={{ flex: 1, padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", lineHeight: 1.6, resize: "none", minHeight: 60, background: loading ? C.bgGray : C.bg, color: C.text, transition: "border-color 0.2s" }} />
                  <button onClick={sendAnswer} disabled={loading || !input.trim()}
                    style={{ padding: "0 20px", background: loading || !input.trim() ? C.border : C.orange, border: "none", borderRadius: 8, color: loading || !input.trim() ? C.light : "#fff", fontSize: 20, cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "background 0.2s" }}>↑</button>
                </div>
              )}

              {phase === "done" && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "20px", textAlign: "center", background: C.bgOrange }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.orange, marginBottom: 6 }}>🎉 面接練習お疲れ様でした！</div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>「まとめを見る」からPDFレポートをダウンロードできます。</div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={retryLastQuestion}
                      style={{ padding: "10px 20px", background: C.bg, border: `2px solid ${C.orange}`, borderRadius: 8, color: C.orange, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      🔄 最後の質問をもう一回
                    </button>
                    <button onClick={() => downloadPDF(univ, messages, allFeedbacks)}
                      style={{ padding: "10px 20px", background: C.orange, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      📄 PDFをダウンロード
                    </button>
                    <button onClick={startInterview}
                      style={{ padding: "10px 20px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 13, cursor: "pointer" }}>
                      ↩️ 初めからやり直す
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右フィードバックパネル */}
          <div className="feedback-panel" style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 80 }}>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 700 }}>📋 この大学が重視すること</div>
              <div style={{ padding: "14px 16px", fontSize: 12, lineHeight: 1.75, color: C.sub }}>
                <div style={{ fontWeight: 700, color: C.orange, marginBottom: 6, fontSize: 11 }}>⭐ 重視ポイント</div>
                <div style={{ marginBottom: 10 }}>{univ.emphasis}</div>
                <div style={{ fontWeight: 700, color: C.gold, marginBottom: 6, fontSize: 11 }}>📄 アドポリ</div>
                <div style={{ fontSize: 11, color: C.muted }}>{univ.adpoli}</div>
              </div>
            </div>

            {allFeedbacks.length > 0 && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 700 }}>📈 平均スコア</div>
                <div style={{ padding: "14px 16px", display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, padding: 10, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor(avgScore), fontFamily: "monospace" }}>{avgScore}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>平均スコア</div>
                  </div>
                  <div style={{ flex: 1, padding: 10, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor(avgAdpoli), fontFamily: "monospace" }}>{avgAdpoli}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>アドポリ適合</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 700 }}>💡 リアルタイムフィードバック</div>
              {feedbackLoading && (
                <div style={{ padding: "32px 16px", textAlign: "center" }}>
                  <div style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.orange, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 10px" }} />
                  <div style={{ fontSize: 12, color: C.orange }}>分析中...</div>
                </div>
              )}
              {!feedbackLoading && !feedback && (
                <div style={{ padding: "24px 16px", textAlign: "center", color: C.light, fontSize: 13 }}>回答するとフィードバックが表示されます</div>
              )}
              {!feedbackLoading && feedback && (
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, padding: 10, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor(feedback.score), fontFamily: "monospace" }}>{feedback.score}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>回答スコア</div>
                    </div>
                    <div style={{ flex: 1, padding: 10, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor(feedback.adpoli_match), fontFamily: "monospace" }}>{feedback.adpoli_match}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>アドポリ適合</div>
                    </div>
                  </div>
                  {feedback.good_points?.length > 0 && (
                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(5,150,105,.2)" }}>
                      <div style={{ padding: "7px 12px", background: "rgba(5,150,105,.08)", color: "#059669", fontWeight: 700, fontSize: 12 }}>✅ 良かった点</div>
                      <div style={{ padding: "10px 12px" }}>{feedback.good_points.map((p, i) => <div key={i} style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>👍 {p}</div>)}</div>
                    </div>
                  )}
                  {feedback.improve_points?.length > 0 && (
                    <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid rgba(239,65,61,.2)` }}>
                      <div style={{ padding: "7px 12px", background: "rgba(239,65,61,.07)", color: C.red, fontWeight: 700, fontSize: 12 }}>⚠️ 改善点</div>
                      <div style={{ padding: "10px 12px" }}>{feedback.improve_points.map((p, i) => <div key={i} style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>🔺 {p}</div>)}</div>
                    </div>
                  )}
                  {feedback.better_answer && (
                    <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid rgba(166,141,96,.2)` }}>
                      <div style={{ padding: "7px 12px", background: "rgba(166,141,96,.07)", color: C.gold, fontWeight: 700, fontSize: 12 }}>✨ より良い回答例</div>
                      <div style={{ padding: "10px 12px", fontSize: 12, color: C.sub, lineHeight: 1.75 }}>{feedback.better_answer}</div>
                    </div>
                  )}
                  <button onClick={retryLastQuestion}
                    style={{ width: "100%", padding: 10, background: C.bg, border: `2px solid ${C.orange}`, borderRadius: 8, color: C.orange, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    🔄 もう一回チャレンジ
                  </button>
                  <button onClick={startInterview}
                    style={{ width: "100%", padding: 10, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 13, cursor: "pointer", marginTop: 4 }}>
                    ↩️ 初めからやり直す
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {scoreModalOpen && (
        <ScoreModal feedback={feedback} allFeedbacks={allFeedbacks} univ={univ} onClose={() => setScoreModalOpen(false)} />
      )}
    </div>
  );
}