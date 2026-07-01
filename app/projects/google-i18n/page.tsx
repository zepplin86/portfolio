"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, Terminal, FileCode, FolderTree, Play, RotateCcw, Code2, ChevronDown } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────
interface SheetRow {
  key: string;
  ko: string;
  en: string;
  ja: string;
}

type Lang = "ko" | "en" | "ja";
const LANGS: Lang[] = ["ko", "en", "ja"];
const LANG_LABEL: Record<Lang, string> = { ko: "한국어", en: "English", ja: "日本語" };

interface LogLine {
  tag: string;
  text: string;
  color: string;
}

// 시트 title — 실제 모듈에서 sheet title별로 파일을 분리한다 (여기선 단일 시트 데모)
const SHEET_TITLE = "Kollus VOD 2.0";

const INITIAL_ROWS: SheetRow[] = [
  { key: "common.confirm", ko: "확인", en: "Confirm", ja: "確認" },
  { key: "common.cancel", ko: "취소", en: "Cancel", ja: "キャンセル" },
  { key: "player.greeting", ko: ":name님 환영합니다", en: "Welcome :name", ja: ":nameさん、ようこそ" },
  { key: "player.play", ko: "재생", en: "Play", ja: "再生" },
  { key: "player.support", ko: "문의: support@kollus.com", en: "Contact: support@kollus.com", ja: "お問い合わせ: support@kollus.com" },
];

// ── Build logic (스펙의 I18nBuilderFromSheets 를 클라이언트에서 순수 재현) ──
// :param → {param} 치환. 단, mailto:/tel: 은 제외 (스펙의 (?<!mailto|tel):\w+ 정규식 재현)
function replaceParams(str: string): string {
  if (!str) return "";
  return str.replace(/(?<!mailto|tel):\w+/gi, (m) => `{${m.substring(1)}}`);
}

// lodash set 재현: "common.confirm" 같은 점 경로를 중첩 객체로 만든다
function setDeep(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== "object" || cur[p] === null) cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

// 한 언어의 전체 시트를 빌드 데이터(중첩 객체)로 변환
function buildLangObject(rows: SheetRow[], lang: Lang): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    if (!row.key.trim()) continue;
    setDeep(result, row.key, replaceParams(row[lang]));
  }
  return result;
}

// 생성될 파일 내용 (module.exports = ... 형식, 스펙과 동일)
function makeFileContent(obj: Record<string, unknown>): string {
  return `module.exports = ${JSON.stringify(obj, null, 4)}`;
}

// ── 실제 구현 소스 (포트폴리오 첨부용 — 콘솔 로그 등 일부 생략) ──────────────
const MODULE_CODE = `const { GoogleSpreadsheet } = require('google-spreadsheet');
const set = require('lodash/set');
const merge = require('lodash/merge');
const fs = require('fs');

/**
 * google-spreadsheet API 사용법
 * https://theoephraim.github.io/node-google-spreadsheet/#/
 */
class I18nBuilderFromSheets {
  constructor(sheetId, creds, rootPath = './src/i18n') {
    if (!sheetId) throw new Error('sheetId is not defined');
    if (!creds) throw new Error('must need sheet api key');
    this.doc = new GoogleSpreadsheet(sheetId);
    this.keyName = 'Key';
    this.buildLang = ['ko', 'en', 'ja'];
    this.rootPath = rootPath;
    this.creds = creds;
    this.sheetName = 'Kollus VOD 2.0';
    this.sheetData = [];
    this.headerValues = [];
  }

  // 메인 builder 함수
  async builder() {
    await this.init();
    await this.makeRootFolder();
    await this.findBySheet();
    for (const lang of this.buildLang) {
      let buildData = {};
      const langKey = this.matchLangWord(lang);
      for (const el of this.sheetData) {
        const langData = this.makeLangData(el[this.keyName], el[langKey]);
        buildData = this.objectDeepMerge(buildData, langData);
      }
      for (const [fileName, data] of Object.entries(buildData)) {
        this.translateFileBuilder(fileName, data, lang);
      }
      this.translateLangIndexFileBuilder(lang, Object.entries(buildData));
    }
    this.translateMainIndexFileBuilder();
  }

  /**
   * google-spreadsheet 의 인증/로드 API 가 비동기라
   * 생성자에서 처리할 수 없어 별도 init 으로 분리
   */
  async init() {
    await this.doc.useServiceAccountAuth(this.creds);
    await this.doc.loadInfo();
  }

  makeRootFolder() {
    if (!fs.existsSync(this.rootPath)) fs.mkdirSync(this.rootPath);
  }

  async findBySheet() {
    const sheets = this.sheetsTitle();
    const [, sheetData] = Object.entries(sheets).find(([title]) => title === this.sheetName);
    const rows = await sheetData.getRows();
    this.sheetData = rows;
    this.headerValues = rows[0]._sheet.headerValues;
  }

  // 시트 헤더에서 언어 컬럼 자동 매칭
  matchLangWord(lang) {
    return this.headerValues.find((key) => key.toLowerCase().indexOf(lang) >= 0);
  }

  sheetsTitle() {
    return this.doc.sheetsByTitle;
  }

  // 점 표기 Key 를 중첩 객체로 만들고 :param → {param} 치환
  makeLangData(langkey, str) {
    const langData = {};
    const replaceStr = str
      ? str.replace(/(?<!mailto|tel):\\w+/gi, (m) => \`{\${m.substr(1)}}\`)
      : '';
    set(langData, langkey, replaceStr);
    return langData;
  }

  objectDeepMerge(obj1, obj2) {
    return merge(obj1, obj2);
  }

  // sheet title 별로 번역 파일 생성
  translateFileBuilder(fileName, buildData, lang) {
    const langPath = this.makeI18nLangFolder(lang);
    const exportBuildData = \`module.exports = \${JSON.stringify(buildData, null, 4)}\`;
    fs.writeFileSync(\`\${langPath}/\${fileName}.js\`, exportBuildData);
  }

  makeI18nLangFolder(lang) {
    const langPath = \`\${this.rootPath}/\${lang}\`;
    if (!fs.existsSync(langPath)) fs.mkdirSync(langPath);
    return langPath;
  }

  // 언어별 분리 모듈을 하나로 묶는 index 파일 생성
  translateLangIndexFileBuilder(lang, sheets) {
    const langPath = \`\${this.rootPath}/\${lang}\`;
    let indexfile = '';
    let exportStr = '';
    for (let i = 0; i <= sheets.length - 1; i++) {
      const [title] = sheets[i];
      indexfile += \`const \${title} = require('./\${title}');\\n\`;
      exportStr += i === sheets.length - 1 ? \` \${title} \` : \` \${title},\`;
    }
    indexfile += \`\\nmodule.exports = {\${exportStr}};\`;
    fs.writeFileSync(\`\${langPath}/index.js\`, indexfile.trim());
  }

  // 전체 언어 통합 index 파일 생성
  translateMainIndexFileBuilder() {
    let indexfile = '';
    let exportStr = '';
    for (let i = 0; i <= this.buildLang.length - 1; i++) {
      const lang = this.buildLang[i];
      indexfile += \`const \${lang} = require('./\${lang}');\\n\`;
      exportStr += i === this.buildLang.length - 1 ? \` \${lang} \` : \` \${lang},\`;
    }
    indexfile += \`\\nmodule.exports={\${exportStr}};\`;
    fs.writeFileSync(\`\${this.rootPath}/index.js\`, indexfile.trim());
  }
}

module.exports = I18nBuilderFromSheets;`;

const USAGE_CODE = `// i18nBuilder.js — 프로젝트 root 에서 실행
const I18nBuilderFromSheets = require('./src/helpers/i18nBuilderFromSheetsV2');
const creds = require('./src/config/i18n-sheets-api-key.json'); // Sheet API 키(.gitignore 처리)

(async function () {
  try {
    const sheetId = '{sheetId}'; // 대상 스프레드시트 ID
    const rootPath = './src/i18n'; // 생략 가능
    const builder = new I18nBuilderFromSheets(sheetId, creds, rootPath);
    await builder.builder();
  } catch (e) {
    throw new Error(e);
  }
}());

/*
 package.json
 ────────────────────────────────────────────
 "scripts": {
   "i18n": "node i18nBuilder.js",
   "prebuild": "npm run i18n",   // 프로덕션 빌드 직전 1회만 실행 (API 분당 제한 대응)
   "build": "vue-cli-service build"
 }

 · 개발: npm run i18n 한 번 실행 후 작업
 · 배포: build 시 prebuild 가 자동으로 i18n 생성
*/`;

// ── Main Page ─────────────────────────────────────────────────────────────
export default function GoogleI18nPage() {
  const [rows, setRows] = useState<SheetRow[]>(INITIAL_ROWS);
  const [building, setBuilding] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [built, setBuilt] = useState(false);
  const [activeFile, setActiveFile] = useState<string>("ko");
  const [showCode, setShowCode] = useState(false);

  // 빌드 결과: 언어별 생성 파일 내용
  const generatedFiles = useMemo(() => {
    const files: Record<string, string> = {};
    for (const lang of LANGS) {
      const obj = buildLangObject(rows, lang);
      // sheet title 기준 파일 1개 + lang index
      files[`${lang}/${SHEET_TITLE}.js`] = makeFileContent(obj);
    }
    return files;
  }, [rows]);

  const updateCell = (idx: number, field: keyof SheetRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    setBuilt(false);
  };

  const runBuild = useCallback(async () => {
    setBuilding(true);
    setBuilt(false);
    setLogs([]);

    const sequence: LogLine[] = [
      { tag: " INIT ", text: "GoogleSpreadsheet Doc init", color: "emerald" },
      { tag: " AUTH ", text: "useServiceAccountAuth → 서비스 계정 인증 완료", color: "emerald" },
      { tag: " LOAD ", text: `loadInfo → 시트 "${SHEET_TITLE}" 로드 (${rows.length} rows)`, color: "cyan" },
      { tag: "BUILD", text: "Build Start: Build Language [ko, en, ja]", color: "cyan" },
    ];
    LANGS.forEach((lang) => {
      sequence.push({ tag: "BUILD", text: `File Name: ${lang}/${SHEET_TITLE}.js`, color: "blue" });
    });
    LANGS.forEach((lang) => {
      sequence.push({ tag: "INDEX", text: `${lang}/index.js 생성 (언어별 모듈 묶음)`, color: "purple" });
    });
    sequence.push({ tag: "INDEX", text: "i18n/index.js 생성 (전체 언어 통합)", color: "purple" });
    sequence.push({ tag: "DONE", text: "I18n Build is Success", color: "emerald" });

    for (let i = 0; i < sequence.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 220));
      setLogs((prev) => [...prev, sequence[i]]);
    }

    await new Promise((r) => setTimeout(r, 250));
    setBuilding(false);
    setBuilt(true);
    setActiveFile("ko");
  }, [rows]);

  const reset = () => {
    setRows(INITIAL_ROWS);
    setLogs([]);
    setBuilt(false);
    setBuilding(false);
  };

  const fileTree: { lang: Lang; label: string }[] = LANGS.map((l) => ({ lang: l, label: `${l}/${SHEET_TITLE}.js` }));
  const activeContent = generatedFiles[`${activeFile}/${SHEET_TITLE}.js`] ?? "";

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
            <h2 className="text-2xl font-bold mb-2">Google Sheets → i18n 자동 빌드 시뮬레이터</h2>
            <p className="text-sm text-gray-400">
              스프레드시트 셀을 직접 수정한 뒤 빌드를 실행해보세요. 시트 한 장이 곧바로 ko/en/ja 번역 파일로 자동 생성됩니다.
            </p>
          </div>

          {/* ── Step 1: 모의 스프레드시트 ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet size={14} className="text-emerald-400" />
                Google Spread Sheet — {SHEET_TITLE}
              </p>
              <span className="text-[10px] text-gray-600">셀을 클릭해 수정할 수 있어요</span>
            </div>

            <div className="card border border-white/5 overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    <th className="px-3 py-2.5 text-left text-gray-500 font-medium w-[180px]">Key</th>
                    {LANGS.map((l) => (
                      <th key={l} className="px-3 py-2.5 text-left text-gray-500 font-medium">{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                      <td className="px-1.5 py-1">
                        <input
                          value={row.key}
                          onChange={(e) => updateCell(i, "key", e.target.value)}
                          className="w-full bg-transparent px-2 py-1.5 rounded font-mono text-purple-300 text-xs focus:bg-white/5 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                        />
                      </td>
                      {LANGS.map((l) => (
                        <td key={l} className="px-1.5 py-1">
                          <input
                            value={row[l]}
                            onChange={(e) => updateCell(i, l, e.target.value)}
                            className="w-full bg-transparent px-2 py-1.5 rounded text-gray-300 text-xs focus:bg-white/5 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              💡 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">:name</code> 같은 파라미터는 빌드 시 자동으로
              <code className="text-cyan-300 bg-cyan-900/30 px-1 rounded mx-1">{`{name}`}</code>으로 변환됩니다.
              단 <code className="text-gray-400 bg-white/5 px-1 rounded">support@kollus.com</code> 같은 이메일은 그대로 보존돼요.
            </p>
          </div>

          {/* ── Step 2: 빌드 실행 ── */}
          <div className="flex items-center gap-3">
            <button
              onClick={runBuild}
              disabled={building}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {building ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  빌드 중...
                </>
              ) : (
                <>
                  <Play size={14} />
                  npm run i18n — 빌드 실행
                </>
              )}
            </button>
            {(built || logs.length > 0) && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <RotateCcw size={13} />
                초기화
              </button>
            )}
          </div>

          {/* ── Step 3: 빌드 콘솔 로그 ── */}
          {logs.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal size={14} className="text-cyan-400" />
                Build Console
              </p>
              <div className="card border border-white/5 bg-black/40 p-4 font-mono text-xs flex flex-col gap-1.5 min-h-[120px]">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 animate-fadeIn">
                    <span className={`shrink-0 px-1.5 rounded text-[10px] font-bold ${tagColor(log.color)}`}>
                      {log.tag.trim()}
                    </span>
                    <span className="text-gray-400">{log.text}</span>
                  </div>
                ))}
                {building && <span className="text-gray-600 animate-pulse">▌</span>}
              </div>
            </div>
          )}

          {/* ── Step 4: 생성된 파일 ── */}
          {built && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <FolderTree size={14} className="text-purple-400" />
                생성된 i18n 파일 — ./src/i18n
              </p>
              <div className="card border border-white/5 overflow-hidden flex flex-col sm:flex-row">
                {/* 파일 트리 */}
                <div className="sm:w-52 shrink-0 border-b sm:border-b-0 sm:border-r border-white/5 p-2 flex flex-col gap-0.5 bg-white/2">
                  {fileTree.map((f) => (
                    <button
                      key={f.lang}
                      onClick={() => setActiveFile(f.lang)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                        activeFile === f.lang
                          ? "bg-purple-500/15 text-purple-200"
                          : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      <FileCode size={13} className="shrink-0" />
                      <span className="truncate font-mono">{f.label}</span>
                    </button>
                  ))}
                  <div className="mt-1 pt-1 border-t border-white/5 flex flex-col gap-0.5">
                    {LANGS.map((l) => (
                      <div key={l} className="flex items-center gap-2 px-2.5 py-1 text-[10px] text-gray-600 font-mono">
                        <FileCode size={11} className="shrink-0" />
                        {l}/index.js
                      </div>
                    ))}
                    <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] text-gray-600 font-mono">
                      <FileCode size={11} className="shrink-0" />
                      index.js
                    </div>
                  </div>
                </div>
                {/* 파일 내용 */}
                <div className="flex-1 min-w-0 p-4 bg-black/30 overflow-x-auto">
                  <p className="text-[10px] text-gray-600 mb-2 font-mono">
                    ./src/i18n/{activeFile}/{SHEET_TITLE}.js — {LANG_LABEL[activeFile as Lang]}
                  </p>
                  <pre className="text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">{activeContent}</pre>
                </div>
              </div>
              <p className="text-[11px] text-emerald-400/90 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-4 py-3 leading-relaxed">
                ✅ 빌드 완료. 점(.)으로 구분된 Key가 중첩 객체로 변환되고
                (<code className="text-emerald-300">common.confirm → {`{ common: { confirm } }`}</code>),
                언어별 파일과 index가 자동 생성되었습니다. 시트의 셀을 바꾸고 다시 빌드하면 결과가 그대로 반영됩니다.
              </p>
            </div>
          )}

          {/* ── Step 5: 실제 구현 소스 코드 ── */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowCode((v) => !v)}
              className="flex items-center justify-between w-full card border border-white/5 px-4 py-3 hover:border-white/15 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Code2 size={14} className="text-cyan-400" />
                실제 구현 코드 — I18nBuilderFromSheets
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${showCode ? "rotate-180" : ""}`}
              />
            </button>

            {showCode && (
              <div className="flex flex-col gap-4">
                <div className="card border border-white/5 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
                    <FileCode size={13} className="text-purple-400" />
                    <span className="text-xs font-mono text-gray-400">src/helpers/i18nBuilderFromSheetsV2.js</span>
                  </div>
                  <pre className="p-4 bg-black/30 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">{MODULE_CODE}</pre>
                </div>

                <div className="card border border-white/5 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
                    <FileCode size={13} className="text-emerald-400" />
                    <span className="text-xs font-mono text-gray-400">i18nBuilder.js · package.json</span>
                  </div>
                  <pre className="p-4 bg-black/30 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">{USAGE_CODE}</pre>
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
                Google Sheets 기반<br />i18n 자동화
              </h1>
              <p className="text-sm text-purple-400 mt-2 font-medium">Catenoid · VOD Console</p>
            </div>

            <div className="card p-5 flex flex-col gap-5 text-sm text-gray-400 leading-relaxed">

              <Section title="핵심 결론">
                번역을 코드에서 분리해 <strong className="text-gray-200">Google Sheets에서 관리</strong>하도록 만들었습니다.
                이제 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">npm run i18n</code> 한 번이면 시트가 곧바로 ko/en/ja 번역 파일로 자동 생성됩니다.
                수기로 옮겨 적던 작업이 사라져 <strong className="text-gray-200">이관 실수가 0이 되었고</strong>, 개발자가 아닌 기획·번역 담당자도 시트만 고치면 용어를 직접 관리할 수 있게 됐습니다.
              </Section>

              <Section title="어떤 문제를 풀었나">
                기존에는 번역 담당자가 정리한 Google Spread Sheet를 보고, 개발자가 PHP Laravel의
                <code className="text-purple-300 bg-purple-900/30 px-1 rounded mx-1">resources/lang</code>에 손으로 다시 옮겨 적는 방식이었습니다.
                입사 초기에 용어가 바뀔 때마다 매번 해당 key를 일일이 찾아 고치는 일이 반복됐고, 옮겨 적는 과정에서 누락·오타가 생기기 쉬웠습니다.
                이 반복 작업과 휴먼 에러를 없애기 위해 <strong className="text-gray-200">Sheets API로 번역 파일 생성을 자동화</strong>했습니다.
              </Section>

              <Section title="해결 과정">
                <div className="space-y-3 mt-1">
                  <FlowBlock label="1. 시트 연결" color="emerald">
                    Google Cloud 서비스 계정 키(JSON)를 발급받아
                    <code className="text-purple-300 bg-purple-900/30 px-1 rounded mx-1">useServiceAccountAuth</code>로 인증하고,
                    Sheet ID로 대상 스프레드시트를 로드합니다. 키 파일은 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">.gitignore</code>로 노출을 차단했습니다.
                  </FlowBlock>
                  <FlowBlock label="2. 빌더 모듈화" color="cyan">
                    재사용 가능한 <code className="text-cyan-300 bg-cyan-900/30 px-1 rounded">I18nBuilderFromSheets</code> 클래스로 분리했습니다.
                    시트 헤더에서 언어 컬럼을 자동 매칭하고, 각 행을 순회하며 번역 객체를 만듭니다.
                  </FlowBlock>
                  <FlowBlock label="3. 키 변환 & 병합" color="purple">
                    <code className="text-purple-300 bg-purple-900/30 px-1 rounded">common.confirm</code> 같은 점 표기 Key를
                    lodash <code className="text-purple-300 bg-purple-900/30 px-1 rounded">set</code>·<code className="text-purple-300 bg-purple-900/30 px-1 rounded">merge</code>로
                    중첩 객체로 deep merge하고, <code className="text-purple-300 bg-purple-900/30 px-1 rounded">:name</code> 형태 파라미터를
                    i18n 표준인 <code className="text-cyan-300 bg-cyan-900/30 px-1 rounded">{`{name}`}</code>으로 치환합니다.
                  </FlowBlock>
                  <FlowBlock label="4. 파일 자동 생성" color="purple">
                    sheet title별로 파일을 분리해 언어 폴더에 쓰고, 언어별
                    <code className="text-purple-300 bg-purple-900/30 px-1 rounded mx-1">index.js</code>와 전체 통합
                    <code className="text-purple-300 bg-purple-900/30 px-1 rounded mx-1">index.js</code>까지 자동으로 묶어줍니다.
                  </FlowBlock>
                </div>
              </Section>

              <Section title="설계에서 신경 쓴 점">
                <ul className="space-y-3 mt-1">
                  <PointItem label="API 제한">
                    Sheets API는 분당 호출 수 제한이 있어, 빌드 때마다 매번 부르면 위험합니다. 그래서
                    <code className="text-purple-300 bg-purple-900/30 px-1 rounded mx-1">prebuild</code> 단계(프로덕션 빌드 직전)에만 연결하고,
                    개발 환경에서는 <code className="text-purple-300 bg-purple-900/30 px-1 rounded">npm run i18n</code>을 한 번만 실행한 뒤 작업하도록 가이드했습니다.
                  </PointItem>
                  <PointItem label="비동기 초기화 분리">
                    google-spreadsheet의 인증·로드 API가 비동기라 생성자에서 처리할 수 없었습니다. 별도
                    <code className="text-purple-300 bg-purple-900/30 px-1 rounded mx-1">init()</code>으로 분리해 인스턴스 생성과 I/O를 깔끔하게 나눴습니다.
                  </PointItem>
                  <PointItem label="JS · PHP 양쪽 지원">
                    프론트(Vue/Next 빌드)와 백엔드(PHP Laravel)가 같은 시트를 소스로 쓰도록 양쪽 모듈을 모두 만들어, 번역 관리의 출처를 하나로 통일했습니다.
                  </PointItem>
                </ul>
              </Section>

              <Section title="결과 / 임팩트">
                용어 변경 반영이 &ldquo;시트 수정 → 빌드&rdquo; 두 단계로 줄어 리드타임이 크게 단축됐고, 수기 이관에서 발생하던 휴먼 에러가 사라졌습니다.
                무엇보다 번역·기획 담당자가 개발자를 거치지 않고 직접 용어를 관리하는 <strong className="text-gray-200">셀프서비스 구조</strong>를 만든 것이 가장 큰 성과입니다.
              </Section>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Tech</p>
                <div className="flex flex-wrap gap-2">
                  {["Google Sheets API", "Node.js", "Vue CLI", "PHP Laravel", "lodash", "i18n"].map((t) => (
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

// ── Helper components ─────────────────────────────────────────────────────
function tagColor(color: string): string {
  const map: Record<string, string> = {
    emerald: "bg-emerald-500/20 text-emerald-300",
    cyan: "bg-cyan-500/20 text-cyan-300",
    blue: "bg-blue-500/20 text-blue-300",
    purple: "bg-purple-500/20 text-purple-300",
  };
  return map[color] ?? "bg-white/10 text-gray-300";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">{title}</p>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function FlowBlock({ label, color, children }: { label: string; color: "emerald" | "cyan" | "purple"; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    cyan: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400",
    purple: "border-purple-500/30 bg-purple-500/5 text-purple-400",
  };
  const c = colors[color];
  return (
    <div className={`rounded-lg border p-3 ${c.split(" ").slice(0, 2).join(" ")}`}>
      <p className={`text-xs font-semibold mb-1.5 ${c.split(" ")[2]}`}>{label}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}

function PointItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 list-none">
      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 shrink-0 self-start mt-0.5 whitespace-nowrap">{label}</span>
      <span className="text-xs text-gray-400 leading-relaxed">{children}</span>
    </li>
  );
}
