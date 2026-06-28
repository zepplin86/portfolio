"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, GitBranch, Rocket, Code2, ChevronDown, FileCode, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

// ── 익명화·정제된 build.yml (실제 코드 그대로 X, 회사 고유 식별자 치환) ──────────
const BUILD_YML = `name: Dev / Stage Build and Push

on:
  push:
    branches: ['release/*']   # release 브랜치 push 시 자동 배포

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source code
        uses: actions/checkout@v4

      - name: Extract image version & set build number
        run: |
          IMAGE_NAME="myorg/web-frontend"
          VERSION=$(grep "$IMAGE_NAME" docker-compose.yml | grep image | sed 's/.*://' | tr -d '"' | xargs)
          echo "BUILD_NUMBER=$((RANDOM % 900000 + 100000))" >> $GITHUB_ENV
          echo "VERSION=$VERSION" >> $GITHUB_ENV

      - name: Login to DockerHub
        uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKERHUB_USERNAME }}
          password: \${{ secrets.DOCKERHUB_TOKEN }}

      - name: Install 1Password CLI
        uses: 1password/install-cli-action@v1

      - name: Inject .env from secret manager
        run: op read op://DevOps/web-frontend-dev/env > .env
        env:
          OP_SERVICE_ACCOUNT_TOKEN: \${{ secrets.OP_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build & push image (bake + gha cache)
        uses: docker/bake-action@v5
        with:
          push: true
          set: |
            *.cache-from=type=gha
            *.cache-to=type=gha,mode=max

      - name: Clone GitOps config repo
        run: |
          rm -rf gitops-config
          git clone --depth 1 --branch main https://x-access-token:\${{ secrets.PERSONAL_ACCESS_TOKEN }}@github.com/myorg/gitops-config

      - name: Update Helm values (tag + build_number) and push
        run: |
          git config --global user.name 'ci-bot'
          git config --global user.email 'ci-bot@example.com'

          for ENV in dev stage; do
            cd "gitops-config/helm-charts/$ENV/web-frontend"
            # 이미지 태그 갱신
            sed -i "s|tag:.*|tag: \${{ env.VERSION }}|" values.yaml
            # ArgoCD 가 변경을 감지하도록 build_number 갱신 (핵심)
            sed -i "s|BUILD_NUMBER:.*|BUILD_NUMBER: \${{ env.BUILD_NUMBER }}|" values.yaml
            git -C "$(git rev-parse --show-toplevel)" add .
            cd - > /dev/null
          done

          cd gitops-config
          git commit --allow-empty -m "[BOT] web-frontend \${{ env.VERSION }} image sync for dev/stage"
          git push origin main

      - name: Slack notification
        uses: slackapi/slack-github-action@v1.27.0
        with:
          channel-id: \${{ secrets.SLACK_CHANNEL_ID }}
          payload-file-path: .github/slack/build_message.json
        env:
          WORKFLOW_STATUS: \${{ job.status }}
          SLACK_BOT_TOKEN: \${{ secrets.SLACK_BOT_TOKEN }}`;

const IMAGE_TAG = "v2.4.1"; // 코드만 바뀐 재배포 시나리오 → 태그는 동일

interface Step {
  label: string;
  detail: string;
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function CicdPage() {
  const [fix, setFix] = useState(true); // build_number 자동 갱신 적용 여부
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1); // 진행 중 단계
  const [buildNumber, setBuildNumber] = useState(482913);
  const [prevBuildNumber, setPrevBuildNumber] = useState<number | null>(null);
  const [result, setResult] = useState<null | "deployed" | "stale">(null);
  const [showCode, setShowCode] = useState(false);
  const [deployCount, setDeployCount] = useState(0);

  const steps: Step[] = [
    { label: "release/* push", detail: "release 브랜치에 코드 푸시 감지" },
    { label: "이미지 빌드 · 푸시", detail: `DockerHub로 myorg/web-frontend:${IMAGE_TAG} 빌드·푸시` },
    { label: "GitOps values 갱신", detail: "gitops-config 레포의 values.yaml 수정·커밋" },
    { label: "ArgoCD 감지", detail: fix ? "values.yaml 변경(diff) 감지" : "변경 없음 — 이미지 태그 동일" },
    { label: "k8s 배포", detail: fix ? "OutOfSync → Sync → 새 이미지 롤아웃" : "Sync 스킵 — 이전 이미지 유지" },
  ];

  const runDeploy = useCallback(async () => {
    setRunning(true);
    setResult(null);
    setStepIdx(-1);

    // 새 build_number (해결책 적용 시에만 변경)
    const nextBuild = fix ? Math.floor(Math.random() * 900000 + 100000) : buildNumber;

    for (let i = 0; i < steps.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 520));
      setStepIdx(i);
      if (i === 2) {
        // values.yaml 갱신 시점에 build_number 반영
        setPrevBuildNumber(buildNumber);
        setBuildNumber(nextBuild);
      }
    }
    await new Promise((r) => setTimeout(r, 300));
    setResult(fix ? "deployed" : "stale");
    setDeployCount((c) => c + 1);
    setRunning(false);
  }, [fix, buildNumber, steps.length]);

  const changed = fix; // values.yaml diff 발생 여부

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 px-6 py-4">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          포트폴리오로 돌아가기
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">

        {/* ── LEFT: Interactive Demo ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-8">
          <div>
            <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Live Demo</p>
            <h2 className="text-2xl font-bold mb-2">GitOps 자동 배포 시뮬레이터</h2>
            <p className="text-sm text-gray-400">
              release 브랜치 push부터 ArgoCD 배포까지의 흐름과, ArgoCD가 변경을 감지 못하던 문제를 어떻게 풀었는지 직접 확인해보세요.
            </p>
          </div>

          {/* 컨트롤 */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setFix((v) => !v)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${
                fix
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/50 bg-rose-500/10 text-rose-200"
              }`}
            >
              <RefreshCw size={14} />
              build_number 자동 갱신 {fix ? "ON (해결책)" : "OFF (문제 상황)"}
            </button>
            <button
              onClick={runDeploy}
              disabled={running}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {running ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  배포 중...
                </>
              ) : (
                <>
                  <Rocket size={14} />
                  배포 실행
                </>
              )}
            </button>
          </div>

          {/* 파이프라인 스텝퍼 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <GitBranch size={14} className="text-cyan-400" />
              파이프라인
            </p>
            <div className="flex flex-col gap-2">
              {steps.map((s, i) => {
                const reached = stepIdx >= i;
                const isSkip = !fix && i >= 3 && reached; // build_number 없으면 ArgoCD 감지/배포 단계는 스킵
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition-all ${
                      isSkip
                        ? "border-rose-500/30 bg-rose-500/5"
                        : reached
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-white/8 bg-white/2"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {stepIdx === i && running ? (
                        <div className="w-4 h-4 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin" />
                      ) : isSkip ? (
                        <XCircle size={16} className="text-rose-400" />
                      ) : reached ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-white/15 flex items-center justify-center text-[9px] text-gray-600">{i + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${reached ? "text-white" : "text-gray-400"}`}>{s.label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{s.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* values.yaml + 결과 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card border border-white/5 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
                <FileCode size={13} className="text-gray-400" />
                <span className="text-xs font-mono text-gray-400">gitops-config/.../values.yaml</span>
              </div>
              <pre className="p-4 bg-black/30 overflow-x-auto text-xs font-mono leading-relaxed whitespace-pre">
<span className="text-gray-400">image:
  repository: </span><span className="text-gray-300">myorg/web-frontend</span>
<span className="text-gray-400">  tag: </span><span className="text-gray-300">{IMAGE_TAG}</span>
<span className="text-gray-400">env:</span>
<span className={changed && result ? "text-emerald-300" : "text-gray-400"}>{"  BUILD_NUMBER: "}{buildNumber}{changed && result ? "   # ← 갱신됨" : ""}</span>
              </pre>
            </div>

            <div className={`card overflow-hidden flex flex-col ${
              !result ? "border border-white/5" : result === "deployed" ? "border border-emerald-500/40" : "border border-rose-500/40"
            }`}>
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
                <span className="text-xs font-mono text-gray-400">ArgoCD</span>
              </div>
              <div className="flex-1 p-4 flex flex-col gap-2 justify-center min-h-[120px]">
                {!result ? (
                  <p className="text-xs text-gray-600 text-center">배포를 실행하면 ArgoCD 동기화 결과가 표시됩니다</p>
                ) : result === "deployed" ? (
                  <div className="animate-fadeIn flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 size={15} /> Synced · 배포 완료
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      build_number가 <span className="text-gray-300 font-mono">{prevBuildNumber}</span> → <span className="text-emerald-300 font-mono">{buildNumber}</span>로 바뀌어
                      values.yaml에 diff가 생겼고, ArgoCD가 OutOfSync를 감지해 새 이미지를 롤아웃했습니다.
                    </p>
                  </div>
                ) : (
                  <div className="animate-fadeIn flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-rose-300 flex items-center gap-1.5">
                      <XCircle size={15} /> Synced (변경 없음) · 새 이미지 미반영
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      이미지 태그가 <span className="font-mono text-gray-300">{IMAGE_TAG}</span>로 동일해 values.yaml에 diff가 없습니다.
                      ArgoCD는 Helm chart만 보고 판단하므로 변경을 감지하지 못합니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {deployCount > 0 && (
            <p className="text-[11px] text-gray-600">
              토글을 OFF로 두고 여러 번 배포해보면 build_number가 그대로라 ArgoCD가 계속 미감지합니다. ON이면 매번 값이 바뀌어 항상 반영됩니다.
            </p>
          )}

          {/* 하단 코드 첨부 */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowCode((v) => !v)}
              className="flex items-center justify-between w-full card border border-white/5 px-4 py-3 hover:border-white/15 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Code2 size={14} className="text-cyan-400" />
                GitHub Actions 워크플로 — build.yml
              </span>
              <ChevronDown size={16} className={`text-gray-500 transition-transform ${showCode ? "rotate-180" : ""}`} />
            </button>
            {showCode && (
              <div className="animate-fadeIn">
                <div className="card border border-white/5 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
                    <FileCode size={13} className="text-cyan-400" />
                    <span className="text-xs font-mono text-gray-400">.github/workflows/build.yml</span>
                    <span className="ml-auto text-[10px] text-gray-600">레포·계정 등은 익명화된 예시</span>
                  </div>
                  <pre className="p-4 bg-black/30 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">{BUILD_YML}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Description ───────────────────────────────────────── */}
        <aside className="lg:w-[420px] shrink-0">
          <div className="sticky top-8 flex flex-col gap-6">
            <div>
              <p className="text-xs text-gray-500 tracking-widest uppercase mb-3">Project</p>
              <h1 className="text-3xl font-bold gradient-text leading-tight">
                GitOps 자동 배포<br />파이프라인 구축
              </h1>
              <p className="text-sm text-purple-400 mt-2 font-medium">Catenoid · VOD Console</p>
            </div>

            <div className="card p-5 flex flex-col gap-5 text-sm text-gray-400 leading-relaxed">

              <Section title="핵심 결론">
                배포 인프라를 <strong className="text-gray-200">rancher에서 k8s + ArgoCD</strong>로 옮기는 데 맞춰,
                <strong className="text-gray-200"> release 브랜치에 push만 하면</strong> 이미지 빌드·푸시 → GitOps 레포의 Helm values 갱신 →
                ArgoCD 동기화 → 배포까지 자동으로 도는 파이프라인을 GitHub Actions로 구축했습니다.
              </Section>

              <Section title="배경">
                회사가 배포 시스템을 k8s로 이전하면서 내부 배포 방식도 함께 바꿔야 했습니다. DevOps에서 k8s·ArgoCD 초기 구축과
                Helm chart 템플릿을 제공해주었고, 저는 거기에 맞춰 <strong className="text-gray-300">프론트엔드 자동 배포 흐름</strong>을 GitHub Actions로 구현했습니다.
              </Section>

              <Section title="구축한 파이프라인">
                소스 체크아웃 → 이미지 버전 추출 → DockerHub 로그인 → <strong className="text-gray-300">1Password로 .env 주입</strong> →
                Buildx/bake로 이미지 빌드·푸시(gha 캐시) → <strong className="text-gray-300">GitOps 레포 클론 후 values.yaml의 이미지 태그 갱신·커밋·푸시</strong> → Slack 알림.
                애플리케이션 레포와 배포 설정(GitOps) 레포를 분리해, 빌드는 Actions가 하고 배포는 ArgoCD가 맡는 구조입니다.
              </Section>

              <Section title="트러블슈팅 — ArgoCD가 변경을 못 잡던 문제">
                <div className="space-y-3 mt-1">
                  <FlowBlock label="증상" color="rose">
                    코드가 바뀌어 이미지를 다시 빌드·배포해도 ArgoCD가 <strong className="text-gray-300">변경을 감지하지 못해</strong> 새 이미지가 반영되지 않았습니다.
                  </FlowBlock>
                  <FlowBlock label="원인" color="amber">
                    ArgoCD는 <strong className="text-gray-300">Helm chart의 변경만 보고 동기화 여부를 판단</strong>합니다. 이미지 태그가 그대로면 values.yaml에 diff가 없어, 새로 배포되었다고 인식하지 못합니다.
                  </FlowBlock>
                  <FlowBlock label="해결" color="emerald">
                    Helm values에 <code className="text-emerald-300 bg-emerald-900/30 px-1 rounded">build_number</code>를 추가하고,
                    GitHub Actions 배포 때마다 <strong className="text-gray-300">랜덤 값으로 갱신</strong>했습니다. 항상 diff가 생기므로 ArgoCD가 매 배포를 변경으로 인식해 동기화합니다.
                  </FlowBlock>
                </div>
              </Section>

              <Section title="결과">
                release 브랜치 push 한 번으로 dev/stage 환경에 자동 배포되는 흐름을 완성했고, 이미지 태그가 같은 재배포도 누락 없이 반영됩니다.
              </Section>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Tech</p>
                <div className="flex flex-wrap gap-2">
                  {["GitHub Actions", "Docker", "Kubernetes", "ArgoCD", "Helm", "GitOps", "1Password"].map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">{title}</p>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function FlowBlock({ label, color, children }: { label: string; color: "rose" | "amber" | "emerald"; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    rose: "border-rose-500/30 bg-rose-500/5 text-rose-400",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  };
  const c = colors[color];
  return (
    <div className={`rounded-lg border p-3 ${c.split(" ").slice(0, 2).join(" ")}`}>
      <p className={`text-xs font-semibold mb-1.5 ${c.split(" ")[2]}`}>{label}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}
