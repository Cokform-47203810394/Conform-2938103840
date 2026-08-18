import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Check,
  Download,
  FileImage,
  FileWarning,
  FileText,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnchorNav, DocumentCard, PublicPageShell } from "../components/PublicPageShell";

const colors = [
  ["Deep Green", "#0F5B46", "핵심 브랜드 면·심볼 바탕"],
  ["Cokform Green", "#17866D", "상태·링크·인터랙션"],
  ["Leaf Green", "#73B99D", "보조 라인·그래픽"],
  ["Soft Mint", "#EAF7EF", "밝은 보조 면"],
  ["Ink Green", "#123D31", "타이포그래피·어두운 표현"],
  ["Warm White", "#FFFDF8", "밝은 표면·배경"],
];

const navItems = [
  { href: "#assets", label: "공식 자산" },
  { href: "#colors", label: "색상" },
  { href: "#usage", label: "사용 원칙" },
  { href: "#policy", label: "정책·문의" },
];

const formatMeta = {
  png: { label: "PNG", icon: FileImage, description: "투명 배경 래스터" },
  jpg: { label: "JPG", icon: FileImage, description: "밝은 배경 래스터" },
  pdf: { label: "PDF", icon: FileText, description: "벡터 인쇄 파일" },
  svg: { label: "SVG", icon: FileText, description: "무손실 벡터 원본" },
};

const brandAssets = [
  {
    id: "logo",
    title: "기본 로고",
    description: "밝은 배경의 문서, 웹 화면, 소개 자료에 사용합니다.",
    preview: "/brand/cokform-logo.svg",
    previewAlt: "콕폼 기본 로고",
    previewClassName: "w-full max-w-sm",
    previewSurfaceClassName: "bg-white",
    stem: "cokform-logo",
    qualityOptions: {
      png: [
        { value: "1024", label: "웹 · 1024 × 273px" },
        { value: "2048", label: "고화질 · 2048 × 546px" },
        { value: "4096", label: "인쇄용 · 4096 × 1092px" },
      ],
      jpg: [
        { value: "1024", label: "웹 · 1024 × 273px" },
        { value: "2048", label: "고화질 · 2048 × 546px" },
        { value: "4096", label: "인쇄용 · 4096 × 1092px" },
      ],
      pdf: [{ value: "vector", label: "벡터 · 해상도 제한 없음" }],
      svg: [{ value: "vector", label: "벡터 원본 · 해상도 제한 없음" }],
    },
  },
  {
    id: "mark",
    title: "심볼 마크",
    description: "앱 아이콘, 프로필, 좁은 영역에서만 사용합니다.",
    preview: "/brand/cokform-mark.svg",
    previewAlt: "콕폼 심볼 마크",
    previewClassName: "h-28 w-28",
    previewSurfaceClassName: "bg-[#EAF7EF]",
    stem: "cokform-mark",
    qualityOptions: {
      png: [
        { value: "512", label: "웹 · 512 × 512px" },
        { value: "1024", label: "고화질 · 1024 × 1024px" },
        { value: "2048", label: "인쇄용 · 2048 × 2048px" },
      ],
      jpg: [
        { value: "512", label: "웹 · 512 × 512px" },
        { value: "1024", label: "고화질 · 1024 × 1024px" },
        { value: "2048", label: "인쇄용 · 2048 × 2048px" },
      ],
      pdf: [{ value: "vector", label: "벡터 · 해상도 제한 없음" }],
      svg: [{ value: "vector", label: "벡터 원본 · 해상도 제한 없음" }],
    },
  },
];

function getDownloadPath(asset, format, quality) {
  if (format === "svg") return `/brand/${asset.stem}.svg`;
  if (format === "pdf") return `/brand/${asset.stem}.pdf`;
  return `/brand/${asset.stem}-${quality}.${format}`;
}

function getFileName(asset, format, quality) {
  const suffix = format === "svg" || format === "pdf" ? "" : `-${quality}`;
  return `${asset.stem}${suffix}.${format}`;
}

export default function ResourcesPage({ onBack }) {
  const [downloads, setDownloads] = useState({
    logo: { format: "png", quality: "2048" },
    mark: { format: "png", quality: "1024" },
  });

  useEffect(() => {
    document.title = "Cokform 브랜드 리소스 센터";
  }, []);

  const selectedAssets = useMemo(
    () => brandAssets.map((asset) => ({ ...asset, selection: downloads[asset.id] })),
    [downloads],
  );

  function setFormat(asset, format) {
    const nextQuality = asset.qualityOptions[format][0].value;
    setDownloads((current) => ({
      ...current,
      [asset.id]: { format, quality: nextQuality },
    }));
  }

  function setQuality(assetId, quality) {
    setDownloads((current) => ({
      ...current,
      [assetId]: { ...current[assetId], quality },
    }));
  }

  return (
    <PublicPageShell
      eyebrow="COKFORM / BRAND RESOURCES"
      title="Cokform을 정확하게 소개할 수 있는 공식 리소스입니다."
      description="로고, 마크, 색상, 서비스명 표기와 브랜드 사용 원칙을 확인하세요. Cokform은 고객의 자유도를 우선하고, 개인정보 보호를 그 자유를 가능하게 하는 기반으로 생각합니다."
      icon={Palette}
      onBack={onBack}
      aside={<AnchorNav items={navItems} />}
    >
      <DocumentCard tone="success">
        <div className="flex gap-3">
          <BadgeCheck size={21} className="mt-0.5 shrink-0 text-[#0B4D3D]" />
          <div>
            <h2 className="font-semibold text-[#0B4D3D]">공식성 확인</h2>
            <p className="mt-1 text-sm leading-6">
              공식 로고는 이 페이지와 Cokform 저장소의 <code>public/brand</code> 경로에서만 받으세요. Cokform의
              파트너십·보증·승인이 있는 것처럼 보이게 하는 사용은 허용되지 않습니다.
            </p>
          </div>
        </div>
      </DocumentCard>

      <section id="assets" className="scroll-mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-[#17866D]" />
          <h2 className="text-xl font-bold tracking-[-0.04em]">공식 자산</h2>
        </div>
        <p className="mb-4 text-sm leading-6 text-[#59645E]">
          파일 형식과 해상도를 고른 뒤 내려받으세요. SVG·PDF는 크기를 키워도 깨지지 않는 벡터 원본이며, PNG는 투명
          배경, JPG는 밝은 배경으로 제공됩니다.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {selectedAssets.map((asset) => {
            const { format, quality } = asset.selection;
            const FormatIcon = formatMeta[format].icon;
            const qualityOptions = asset.qualityOptions[format];
            const selectedQuality = qualityOptions.find((option) => option.value === quality);
            const downloadPath = getDownloadPath(asset, format, quality);
            const downloadName = getFileName(asset, format, quality);

            return (
              <article
                key={asset.id}
                className="overflow-hidden rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] shadow-[0_6px_20px_rgba(23,37,31,0.05)]"
              >
                <div className={`flex min-h-48 items-center justify-center p-8 ${asset.previewSurfaceClassName}`}>
                  <img src={asset.preview} alt={asset.previewAlt} className={asset.previewClassName} />
                </div>
                <div className="border-t border-[#DDE1D9] p-5">
                  <h3 className="font-semibold">{asset.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#59645E]">{asset.description}</p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-[#345247]">
                      파일 형식
                      <select
                        value={format}
                        onChange={(event) => setFormat(asset, event.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#C9D8CF] bg-white px-3 py-2.5 text-sm font-medium text-[#123D31] outline-none transition focus:border-[#17866D] focus:ring-2 focus:ring-[#17866D]/20"
                      >
                        {Object.entries(formatMeta).map(([value, meta]) => (
                          <option key={value} value={value}>
                            {meta.label} · {meta.description}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-semibold text-[#345247]">
                      해상도·품질
                      <select
                        value={quality}
                        onChange={(event) => setQuality(asset.id, event.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#C9D8CF] bg-white px-3 py-2.5 text-sm font-medium text-[#123D31] outline-none transition focus:border-[#17866D] focus:ring-2 focus:ring-[#17866D]/20"
                      >
                        {qualityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs leading-5 text-[#59645E]">
                    <FormatIcon size={14} className="shrink-0 text-[#17866D]" />
                    <span>
                      선택됨: {formatMeta[format].label} · {selectedQuality?.label}
                    </span>
                  </div>

                  <a
                    href={downloadPath}
                    download={downloadName}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#0F5B46] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#0B4D3D] active:scale-[0.97]"
                  >
                    <Download size={14} /> 선택 파일 다운로드
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="colors" className="scroll-mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Palette size={18} className="text-[#17866D]" />
          <h2 className="text-xl font-bold tracking-[-0.04em]">색상 시스템</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {colors.map(([name, hex, usage]) => (
            <article
              key={hex}
              className="flex items-center gap-4 rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-4 shadow-[0_4px_14px_rgba(23,37,31,0.04)]"
            >
              <span className="h-12 w-12 shrink-0 rounded-xl border border-black/5" style={{ backgroundColor: hex }} />
              <div className="min-w-0">
                <h3 className="font-semibold">{name}</h3>
                <p className="mt-0.5 font-mono text-xs text-[#17866D]">{hex}</p>
                <p className="mt-1 text-xs text-[#78837C]">{usage}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="usage" className="scroll-mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Check size={18} className="text-[#17866D]" />
          <h2 className="text-xl font-bold tracking-[-0.04em]">사용 원칙</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <DocumentCard>
            <h3 className="font-semibold text-[#0B4D3D]">권장</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#59645E]">
              <li>• 원본 SVG의 비율과 색상을 유지합니다.</li>
              <li>• 흰색 또는 충분히 대비되는 단색 배경에 사용합니다.</li>
              <li>• 첫 표기는 <code>콕폼(Cokform)</code> 또는 <code>콕폼</code>으로 씁니다.</li>
              <li>• <code>작성자만 자신의 키로 읽도록 설계</code>처럼 검증 가능한 설명을 사용합니다.</li>
            </ul>
          </DocumentCard>
          <DocumentCard tone="notice">
            <h3 className="font-semibold">피해야 할 사용</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6">
              <li>• 로고의 비율·색상·방향을 임의로 변경하는 행위</li>
              <li>• 낮은 대비의 사진·패턴 위에 바로 배치하는 행위</li>
              <li>• 제휴·승인·보증이 있는 것처럼 보이게 하는 사용</li>
              <li>• “완벽한 보안”, “해킹 불가” 등 절대적 보장 표현</li>
            </ul>
          </DocumentCard>
        </div>
      </section>

      <section id="policy" className="scroll-mt-8">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#17866D]" />
          <h2 className="text-xl font-bold tracking-[-0.04em]">정책과 문의</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/docs/brand-guide"
            className="group rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-5 shadow-[0_5px_18px_rgba(23,37,31,0.05)] transition hover:border-[#B7DCC8]"
          >
            <Palette size={20} className="text-[#17866D]" />
            <h3 className="mt-3 font-semibold">브랜드 상세 가이드</h3>
            <p className="mt-1 text-sm leading-6 text-[#59645E]">형식·해상도 선택, 색상, 표기 기준, 사용 원칙을 Cokform 안에서 확인합니다.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0B4D3D]">
              가이드 열기 <ArrowUpRight size={13} />
            </span>
          </a>
          <a
            href="/docs"
            className="group rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-5 shadow-[0_5px_18px_rgba(23,37,31,0.05)] transition hover:border-[#B7DCC8]"
          >
            <BookOpen size={20} className="text-[#17866D]" />
            <h3 className="mt-3 font-semibold">제품 문서</h3>
            <p className="mt-1 text-sm leading-6 text-[#59645E]">기능, 보안, 개인정보 수집 운영, 내보내기 가이드를 확인합니다.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0B4D3D]">
              문서 열기 <ArrowUpRight size={13} />
            </span>
          </a>
          <a
            href="mailto:seoharo0111@gmail.com"
            className="group rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-5 shadow-[0_5px_18px_rgba(23,37,31,0.05)] transition hover:border-[#B7DCC8]"
          >
            <FileWarning size={20} className="text-[#17866D]" />
            <h3 className="mt-3 font-semibold">브랜드 사용 문의</h3>
            <p className="mt-1 text-sm leading-6 text-[#59645E]">언론·파트너 소개, 공식 로고 요청, 사용 가능 여부를 문의하세요.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0B4D3D]">
              문의하기 <ArrowUpRight size={13} />
            </span>
          </a>
        </div>
      </section>
    </PublicPageShell>
  );
}
