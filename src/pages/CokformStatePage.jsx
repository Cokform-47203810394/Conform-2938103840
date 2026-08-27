import { useEffect, useState } from "react";
import { Activity, CheckCircle2, CircleAlert, Database, Globe2, RefreshCw, ShieldCheck } from "lucide-react";
import { PublicPageShell, DocumentCard } from "../components/PublicPageShell";
import { getSupabaseClient, getSupabaseConfig } from "../lib/supabaseClient";

const initialChecks = [
  { id: "web", label: "Cokform 웹 앱", detail: "이 상태 페이지가 정상적으로 열렸습니다.", icon: Globe2, state: "ok" },
  { id: "database", label: "공개 폼 저장소", detail: "연결을 확인하는 중입니다.", icon: Database, state: "checking" },
  { id: "gateway", label: "응답 제출 게이트웨이", detail: "연결을 확인하는 중입니다.", icon: ShieldCheck, state: "checking" },
];

function formatCheckedAt(value) {
  if (!value) return "아직 확인하지 않았습니다.";
  return new Date(value).toLocaleString("ko-KR", {
    month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function StateBadge({ state }) {
  const labels = { ok: "정상", checking: "확인 중", attention: "확인 필요" };
  const classes = {
    ok: "bg-[#EAF6EF] text-[#0B4D3D]",
    checking: "bg-[#FFF4D8] text-[#765C05]",
    attention: "bg-[#FFF0EE] text-[#8C1D18]",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes[state] || classes.attention}`}>{labels[state] || labels.attention}</span>;
}

export default function CokformStatePage({ onBack }) {
  const [checks, setChecks] = useState(initialChecks);
  const [checkedAt, setCheckedAt] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkServices = async () => {
    setChecking(true);
    setChecks((current) => current.map((item) => item.id === "web" ? item : { ...item, state: "checking", detail: "연결을 확인하는 중입니다." }));

    const client = getSupabaseClient();
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 6000);
    const [{ status: databaseStatus }, { status: gatewayStatus }] = await Promise.all([
      (async () => {
        if (!client) return { status: "attention", detail: "공개 저장소 연결 정보를 찾지 못했습니다." };
        const { error } = await client.from("form_public").select("id", { head: true }).limit(1);
        return error
          ? { status: "attention", detail: "저장소 연결을 확인하지 못했습니다. 잠시 후 다시 확인해 주세요." }
          : { status: "ok", detail: "공개 폼 메타데이터 연결이 정상입니다." };
      })(),
      (async () => {
        const url = getSupabaseConfig().url;
        if (!url) return { status: "attention", detail: "응답 게이트웨이 연결 정보를 찾지 못했습니다." };
        try {
          const response = await fetch(`${url}/functions/v1/submit-e2ee-response`, { method: "OPTIONS", signal: controller.signal });
          return response.status === 204
            ? { status: "ok", detail: "제출 전용 게이트웨이가 응답합니다." }
            : { status: "attention", detail: "게이트웨이 응답을 확인하지 못했습니다. 잠시 후 다시 확인해 주세요." };
        } catch {
          return { status: "attention", detail: "게이트웨이 연결을 확인하지 못했습니다. 네트워크 상태를 확인해 주세요." };
        }
      })(),
    ]);
    window.clearTimeout(timer);
    setChecks((current) => current.map((item) => item.id === "database" ? { ...item, ...databaseStatus } : item.id === "gateway" ? { ...item, ...gatewayStatus } : item));
    setCheckedAt(new Date().toISOString());
    setChecking(false);
  };

  useEffect(() => { checkServices(); }, []);
  useEffect(() => { document.title = "Cokform State · 콕폼"; }, []);

  const allHealthy = checks.every((item) => item.state === "ok");
  return (
    <PublicPageShell
      eyebrow="서비스 상태"
      title="Cokform State"
      description="지금 이 브라우저에서 공개 웹 앱·공개 폼 저장소·응답 제출 게이트웨이의 연결 상태를 읽기 전용으로 확인합니다."
      icon={Activity}
      onBack={onBack}
    >
      <DocumentCard tone={allHealthy ? "notice" : "warning"}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {allHealthy ? <CheckCircle2 className="mt-0.5 text-[#17866D]" size={20} /> : <CircleAlert className="mt-0.5 text-[#B87913]" size={20} />}
            <div><h2 className="font-semibold text-[#17251F]">{allHealthy ? "핵심 연결이 정상입니다" : "일부 연결을 확인하지 못했습니다"}</h2><p className="mt-1 text-sm leading-6 text-[#59645E]">마지막 확인: {formatCheckedAt(checkedAt)}</p></div>
          </div>
          <button type="button" onClick={checkServices} disabled={checking} className="inline-flex items-center gap-1.5 rounded-full border border-[#B7DCC8] bg-white px-3 py-2 text-xs font-semibold text-[#0B4D3D] hover:bg-[#EAF6EF] disabled:opacity-50"><RefreshCw size={14} className={checking ? "animate-spin" : ""} />{checking ? "확인 중…" : "다시 확인"}</button>
        </div>
      </DocumentCard>

      <section className="mt-6 space-y-3" aria-label="서비스별 상태">
        {checks.map((item) => {
          const Icon = item.icon;
          return <article key={item.id} className="flex items-start gap-3 rounded-xl border border-[#DDE1D9] bg-[#FFFDF8] p-4 sm:p-5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF6EF] text-[#0B4D3D]"><Icon size={17} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-[#17251F]">{item.label}</h2><StateBadge state={item.state} /></div><p className="mt-1 text-sm leading-6 text-[#59645E]">{item.detail}</p></div></article>;
        })}
      </section>

      <DocumentCard className="mt-6">
        <h2 className="font-semibold text-[#17251F]">이 페이지가 확인하는 범위</h2>
        <p className="mt-2 text-sm leading-6 text-[#59645E]">폼 제목이나 암호화된 응답, 개인키, 이메일 등 개인정보는 조회하지 않습니다. 이 화면은 현재 브라우저의 공개 연결만 확인하므로, 네트워크 차단·일시적 지연으로 ‘확인 필요’가 표시될 수 있으며 즉시 장애를 뜻하지는 않습니다.</p>
        <p className="mt-2 text-sm leading-6 text-[#59645E]">현재 Cokform은 비공개 파일럿 단계입니다. 공식 장애 이력과 외부 상태 알림 채널은 정식 운영 정책이 확정되면 별도로 안내합니다.</p>
      </DocumentCard>
    </PublicPageShell>
  );
}
