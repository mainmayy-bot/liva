import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { createContext, useContext } from "react";
import {
  Archive,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  CircleUserRound,
  Clock3,
  Cloud,
  Compass,
  Dumbbell,
  Footprints,
  GripVertical,
  GraduationCap,
  Heart,
  Home,
  House,
  Leaf,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  LogIn,
  Mail,
  Mic,
  MessageCircle,
  Mountain,
  Moon,
  Music,
  MoreHorizontal,
  NotebookPen,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PawPrint,
  Plane,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Utensils,
  Video,
  WalletCards,
  X,
} from "lucide-react";
import "./styles.css";
import "./refinements.css";
import "./mobile-home.css";
import "./mobile-depth.css";
import "./mobile-realm.css";
import "./assistant.css";
import "./mobile-final.css";
import {
  isSupabaseConfigured,
  loadCloudSnapshot,
  saveCloudSnapshot,
  supabase,
} from "./lib/supabase";
import { layoutTimelineItems } from "./lib/timeline-layout";

function useTouchReorder(moveItem) {
  const moveRef = useRef(moveItem), dragRef = useRef(null), suppressClickRef = useRef(false);
  moveRef.current = moveItem;
  const cleanup = () => {
    window.clearTimeout(dragRef.current?.timer);
    dragRef.current?.sourceElement?.classList.remove("is-touch-dragging");
    dragRef.current?.targetElement?.classList.remove("is-drop-target");
    dragRef.current?.targetElement?.removeAttribute("data-drop-edge");
    dragRef.current = null;
    document.body.classList.remove("mobile-reordering");
  };
  const bind = (key) => ({
    onTouchStart: (event) => {
      event.stopPropagation();
      const touch = event.touches[0];
      suppressClickRef.current = false;
      dragRef.current = {
        key: String(key),
        x: touch.clientX,
        y: touch.clientY,
        sourceElement: event.currentTarget.closest?.("[data-touch-order]") || event.currentTarget,
        timer: window.setTimeout(() => {
          if (!dragRef.current) return;
          dragRef.current.active = true;
          suppressClickRef.current = true;
          dragRef.current.sourceElement?.classList.add("is-touch-dragging");
          document.body.classList.add("mobile-reordering");
          navigator.vibrate?.(12);
        }, 320),
      };
    },
    onTouchMove: (event) => {
      const drag = dragRef.current, touch = event.touches[0];
      if (!drag) return;
      if (!drag.active && Math.hypot(touch.clientX - drag.x, touch.clientY - drag.y) > 8) {
        window.clearTimeout(drag.timer);
        dragRef.current = null;
        return;
      }
      if (!drag.active) return;
      event.preventDefault();
      const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest?.("[data-touch-order]");
      const targetKey = target?.dataset.touchOrder;
      const targetRect = target?.getBoundingClientRect();
      const dropEdge = targetRect && touch.clientY < targetRect.top + targetRect.height / 2 ? "before" : "after";
      if (target !== drag.targetElement) {
        drag.targetElement?.classList.remove("is-drop-target");
        drag.targetElement?.removeAttribute("data-drop-edge");
        target?.classList.add("is-drop-target");
        drag.targetElement = target;
      }
      if (target) target.dataset.dropEdge = dropEdge;
      if (targetKey && targetKey !== drag.key) {
        moveRef.current(drag.key, targetKey);
        drag.key = targetKey;
      }
    },
    onTouchEnd: cleanup,
    onTouchCancel: cleanup,
    onClick: (event) => {
      if (suppressClickRef.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
      }
    },
  });
  return bind;
}

function applyAppearance(theme, density, followSystem = false) {
  const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    ).matches,
    effectiveTheme = followSystem ? (prefersDark ? "静夜" : "自然") : theme,
    root = document.documentElement;
  root.dataset.theme =
    effectiveTheme === "静夜"
      ? "dark"
      : effectiveTheme === "暖白"
        ? "warm"
        : "natural";
  root.dataset.density =
    density === "紧凑"
      ? "compact"
      : density === "宽松"
        ? "relaxed"
        : "comfortable";
  localStorage.setItem(
    "liva-appearance",
    JSON.stringify({ theme, density, followSystem }),
  );
}
const savedAppearance = (() => {
  try {
    return (
      JSON.parse(localStorage.getItem("liva-appearance")) || {
        theme: "自然",
        density: "舒适",
        followSystem: false,
      }
    );
  } catch {
    return { theme: "自然", density: "舒适", followSystem: false };
  }
})();
const defaultProfile = {
  name: "May",
  initials: "M",
  bio: "把生活整理成自己喜欢的样子",
};
const savedProfile = (() => {
  try {
    return { ...defaultProfile, ...JSON.parse(localStorage.getItem("liva-profile")) };
  } catch {
    return defaultProfile;
  }
})();
const ProfileContext = createContext({ profile: savedProfile, saveProfile: () => {} });
const useLivaProfile = () => useContext(ProfileContext);
const defaultInspirationMemos = [
  {
    id: 1,
    text: "周末去旧书店看看旅行随笔",
    time: "刚刚",
    done: false,
    converted: false,
  },
  {
    id: 2,
    text: "试试把阳台的傍晚光线拍成一组照片",
    time: "昨天",
    done: false,
    converted: false,
  },
  {
    id: 3,
    text: "记下最近反复想到的三个关键词",
    time: "8月9日",
    done: true,
    converted: false,
  },
];
const inspirationMemos = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem("liva-inspiration-memos"));
    return Array.isArray(saved) ? saved : defaultInspirationMemos;
  } catch {
    return defaultInspirationMemos;
  }
})();
function persistInspirationMemos(next) {
  inspirationMemos.splice(0, inspirationMemos.length, ...next);
  localStorage.setItem(
    "liva-inspiration-memos",
    JSON.stringify(inspirationMemos),
  );
}

const realms = [
  {
    name: "Fortune",
    note: "财富与事业",
    Icon: BriefcaseBusiness,
    color: "#d8ad60",
    tint: "#fffdfa",
    intro:
      "关于工作、专业能力、收入与长期选择。它不是必须抵达的终点，而是你与现实世界建立关系的方式。",
    directions: ["日常工作", "专业成长", "财务整理", "长期选择"],
  },
  {
    name: "Beauty",
    note: "身材与美貌",
    Icon: Heart,
    color: "#dda2a4",
    tint: "#fffafb",
    intro:
      "照顾身体的感受、能量和外在表达。这里容纳健康、运动、穿搭，以及一切让你更自在的实践。",
    directions: ["身体健康", "舒展运动", "个人风格", "日常护理"],
  },
  {
    name: "Soul",
    note: "生活方式与体验",
    Icon: Leaf,
    color: "#91b39a",
    tint: "#fafcfb",
    intro:
      "为好奇心、体验与内在感受留下空间。阅读、旅行和创造都可以自然发生，不必证明什么。",
    directions: ["阅读输入", "旅行探索", "创造表达", "独处感受"],
  },
  {
    name: "Admin",
    note: "日常运营",
    Icon: Settings2,
    color: "#91aace",
    tint: "#fafbfd",
    intro:
      "承接生活里必要但琐碎的部分。日程、家务、资料与关系维护，让生活运行得更轻松。",
    directions: ["日程整理", "空间维护", "资料归档", "关系联络", "临时待办事项"],
  },
];
const defaultRealmNotes = {
  Fortune: "财富与事业",
  Beauty: "身材与美貌",
  Soul: "生活方式与体验",
  Admin: "日常运营",
};
function getRealmNote(realm) {
  const note = String(realm?.note ?? "").trim();
  return /^\d+$/.test(note) ? defaultRealmNotes[realm?.name] || note : note;
}
const initialTasks = [
  {
    id: 1,
    title: "整理本周工作材料",
    tag: "日常工作",
    time: "今天 15:00",
    level: "normal",
  },
  {
    id: 2,
    title: "预约皮肤科复诊",
    tag: "日常护理",
    time: "今天 18:00",
    level: "late",
  },
  {
    id: 3,
    title: "记录三条旅行灵感",
    tag: "旅行探索",
    time: "今晚",
    level: "normal",
  },
  {
    id: 4,
    title: "采购游泳用品",
    tag: "舒展运动",
    time: "周三之前",
    level: "normal",
  },
  {
    id: 5,
    title: "整理合同资料归档",
    tag: "资料归档",
    time: "原定 8月6日",
    level: "late",
  },
  {
    id: 6,
    title: "阅读一篇英语长文",
    tag: "阅读输入",
    time: "本周",
    level: "normal",
  },
  {
    id: 7,
    title: "睡眠状态记录",
    tag: "身体健康",
    time: "今晚 22:30",
    level: "normal",
  },
  {
    id: 8,
    title: "整理医美功课",
    tag: "日常护理",
    time: "原定 8月8日",
    level: "late",
  },
];

function taskOccursOnDate(task, dateKey) {
  if (!task.date) return true;
  if (task.date === dateKey) return true;
  if (!task.repeat) return false;
  const start = new Date(`${task.date}T00:00:00`);
  const target = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime()) || target < start)
    return false;
  const days = Math.floor((target - start) / 86400000);
  if (task.repeat === "daily") return true;
  if (task.repeat === "weekdays") return target.getDay() >= 1 && target.getDay() <= 5;
  if (task.repeat === "weekends") return target.getDay() === 0 || target.getDay() === 6;
  if (task.repeat === "weekly") return days % 7 === 0;
  if (task.repeat === "custom") {
    const interval = Math.max(1, Number(task.repeatInterval) || 1),
      unit = task.repeatUnit || "day";
    if (task.repeatMode === "weekdays")
      return Array.isArray(task.repeatWeekdays) && task.repeatWeekdays.includes(target.getDay());
    if (unit === "week") {
      if (Array.isArray(task.repeatWeekdays) && task.repeatWeekdays.length)
        return Math.floor(days / 7) % interval === 0 && task.repeatWeekdays.includes(target.getDay());
      return days % (interval * 7) === 0;
    }
    if (unit === "month") {
      const months = (target.getFullYear() - start.getFullYear()) * 12 + target.getMonth() - start.getMonth();
      return target.getDate() === start.getDate() && months % interval === 0;
    }
    if (unit === "year") return target.getDate() === start.getDate() && target.getMonth() === start.getMonth() && (target.getFullYear() - start.getFullYear()) % interval === 0;
    return days % interval === 0;
  }
  if (task.repeat === "monthly") return target.getDate() === start.getDate();
  if (task.repeat === "quarterly")
    return target.getDate() === start.getDate() &&
      (target.getMonth() - start.getMonth() + 12) % 3 === 0;
  if (task.repeat === "yearly")
    return target.getDate() === start.getDate() && target.getMonth() === start.getMonth();
  return false;
}

function repeatLabel(value) {
  return {
    daily: "每天",
    weekdays: "每个工作日",
    weekends: "每个周末",
    weekly: "每周",
    custom: "自定义",
    monthly: "每月",
    yearly: "每年",
  }[value] || "不重复";
}
const directionIcons = [BriefcaseBusiness, BookOpen, Compass, Sparkles],
  directionNotes = [
    "承接日常里正在发生的具体事情",
    "持续积累相关经验、资料与理解",
    "整理这个事项中的生活内容",
    "为变化和新的可能保留空间",
  ];
const directionStates = ["点亮", "点亮", "储备", "储备"];
const matterKinds = ["日常习惯", "长期事项", "一次性项目", "长期事项"];

function iconForMatterName(name = "") {
  const normalized = name.trim().toLowerCase(),
    rules = [
      [/财务|理财|记账|账单|预算|收入|存款|储蓄|投资|报销|税务/, WalletCards],
      [/摄影|拍照|相机/, Camera],
      [/视频|剪辑|影像|电影/, Video],
      [/睡眠|睡觉|早睡|休息|作息/, Moon],
      [/旅行|旅游|出行|航班|机票|度假/, Plane],
      [/路线|导航|城市探索|户外探索/, Compass],
      [/阅读|读书|书籍|输入/, BookOpen],
      [/学习|课程|考试|培训|专业成长|技能/, GraduationCap],
      [/写作|日记|记录|笔记|文案/, NotebookPen],
      [/运动|游泳|健身|跑步|健康|身体|舒展|瑜伽|减肥|塑形/, Dumbbell],
      [/工作|职业|办公|商务|合同|采购|运营|会议|汇报|项目/, BriefcaseBusiness],
      [/日程|时间|计划|安排|提醒|预约/, CalendarDays],
      [/资料|文件|归档|整理|收纳/, Archive],
      [/家庭|家务|空间|居住|房间|装修|维护/, House],
      [/关系|朋友|社交|人脉|家人|同事/, Users],
      [/沟通|联络|消息|聊天|回复/, MessageCircle],
      [/饮食|做饭|早餐|午餐|晚餐|咖啡|烘焙|营养/, Utensils],
      [/宠物|猫|狗|遛狗/, PawPrint],
      [/音乐|乐器|唱歌|钢琴|吉他/, Music],
      [/穿搭|服装|风格|审美|美妆|护肤|发型/, Palette],
      [/创作|创造|灵感|创意|表达/, Lightbulb],
      [/自然|园艺|植物|花园|环保/, Leaf],
      [/习惯|打卡|清单|日常|待办/, ListChecks],
      [/情绪|心理|冥想|放松|自我关怀/, Heart],
    ];
  return rules.find(([pattern]) => pattern.test(normalized))?.[1] || ListChecks;
}
const matters = realms.flatMap((realm) =>
  realm.directions.map((title, index) => ({
    title,
    realm: realm.name,
    state: directionStates[index % directionStates.length],
    kind: matterKinds[index % matterKinds.length],
    note: directionNotes[index % directionNotes.length],
    Icon: iconForMatterName(title),
    todos: initialTasks.filter((task) => task.tag === title),
  })),
);
function realmForTask(task) {
  const linkedMatter = matters.find((item) => item.title === task?.tag),
    realmName = task?.realm || linkedMatter?.realm;
  return realms.find((realm) => realm.name === realmName) ||
    realms.find((realm) => realm.directions.includes(task?.tag)) ||
    realms[3];
}

function taskCompletedOnDate(task, dateKey) {
  if (!task.repeat) return Boolean(task.done);
  if (Array.isArray(task.completedDates) && task.completedDates.includes(dateKey)) return true;
  if (!task.done || !task.completedAt) return false;
  return localDateKey(new Date(task.completedAt)) === dateKey;
}

function taskClockValue(task) {
  return `${task.clock || ""} ${task.meta || ""} ${task.time || ""}`.match(/\d{1,2}:\d{2}/)?.[0] || "";
}

function taskMinuteValue(task) {
  const clock = taskClockValue(task);
  if (!clock) return null;
  const [hour, minute] = clock.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59)
    return null;
  return hour * 60 + minute;
}

let livaDraggedTask = null;

function taskIsOverdueOnDate(task, dateKey, now = new Date()) {
  if (taskCompletedOnDate(task, dateKey)) return false;
  const todayKey = localDateKey(now);
  if (dateKey > todayKey) return false;
  const clock = taskClockValue(task);
  if (dateKey < todayKey) return Boolean(clock);
  if (!clock) return false;
  const [hour, minute] = clock.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() > hour * 60 + minute;
}

function Header({ title, mobileTitle, openModal, navigate }) {
  const { profile } = useLivaProfile(),
    resolvedTitle = title || `下午好， ${profile.name}`;
  return (
    <header className="topbar">
      <div>
        <p className="hello">
          {mobileTitle ? (
            <>
              <span className="header-title-default">{resolvedTitle}</span>
              <span className="header-title-mobile">{mobileTitle}</span>
            </>
          ) : resolvedTitle}
        </p>
        <p className="today">今天是 2026年8月11日，星期二</p>
      </div>
      <div className="head-actions">
        <button onClick={() => openModal("search")} aria-label="搜索">
          <Search />
        </button>
        <button
          className="mobile-inspiration"
          onClick={() => openModal("note")}
          aria-label="记录灵感"
          title="记录灵感"
        >
          <Lightbulb />
        </button>
        <button
          onClick={() => openModal("notice")}
          className="bell"
          aria-label="通知"
        >
          <Bell />
          <i />
        </button>
        <button
          className="avatar"
          onClick={() => openModal("profilePanel")}
          aria-label="个人资料"
        >
          {profile.initials}
        </button>
      </div>
    </header>
  );
}
function Section({ title, sub, action, children, className = "", id }) {
  const displayTitle = title === "生活内容" ? "生活事项" : title,
    displaySub = sub?.replaceAll("生活内容", "生活事项"),
    subtitle =
      displaySub ||
      (className.includes("full-axis") ? "把有明确时间的事情放进一天里" : "");
  return (
    <section id={id} className={`panel ${className}`}>
      <header className="section-head">
        <div>
          <h2>{displayTitle}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
function RealmCard({ realm, index, openModal, matters }) {
  const Icon = realm.Icon,
    matterCount = matters.filter((matter) => matter.realm === realm.name && !matter.archived).length,
    show = () => {
      window.__boardOpenModal = openModal;
      openModal(`realmModal-${index}`);
    };
  return (
    <article
      className="realm"
      data-realm={realm.name}
      onClick={show}
      style={{ "--c": realm.color, "--t": realm.tint }}
    >
      <div className="realm-top">
        <span className="realm-icon">
          <Icon />
        </span>
        <div>
          <h3>{realm.name}</h3>
          <p>{getRealmNote(realm)}</p>
        </div>
      </div>
      <p className="project-count">
        <i /> {matterCount} 个生活事项
      </p>
      <button
        className="detail"
        onClick={(e) => {
          e.stopPropagation();
          show();
        }}
      >
        查看内容 <ChevronRight />
      </button>
      <span className="watermark">
        <Icon />
      </span>
    </article>
  );
}
function MatterCard({ item, index, openModal, tasks }) {
  const realm = realms.find((r) => r.name === item.realm),
    Icon = iconForMatterName(item.title),
    todoCount = tasks.filter(
      (task) => task.tag === item.title && !task.done,
    ).length;
  return (
    <article
      className="goal content-card"
      data-realm={realm.name}
      onClick={() => openModal(`content-${index}`)}
      role="button"
      tabIndex="0"
      onKeyDown={(e) => e.key === "Enter" && openModal(`content-${index}`)}
      style={{ "--c": realm.color, "--t": realm.tint }}
    >
      <div className="goal-title">
        <span>
          <Icon /> {item.title}
        </span>
        <small>{todoCount} 个待办</small>
      </div>
      <div className="goal-meta">
        <span>
          {item.realm} · {item.kind || "长期事项"}
        </span>
      </div>
    </article>
  );
}
function TodoList({ tasks, setTasks, openModal, full = false }) {
  const [deleting, setDeleting] = useState([]),
    [completing, setCompleting] = useState([]);
  const toggle = (id) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || completing.includes(id)) return;
    if (!window.matchMedia?.("(max-width: 800px)").matches) {
      setTasks((value) => value.map((item) => item.id === id ? { ...item, done: !item.done } : item));
      return;
    }
    if (task.done) {
      setTasks((value) => value.map((item) => item.id === id ? { ...item, done: false, completedAt: null } : item));
      return;
    }
    setCompleting((value) => [...value, id]);
    window.setTimeout(() => {
      setTasks((value) => value.map((item) => item.id === id ? { ...item, done: true, completedAt: new Date().toISOString() } : item));
      setCompleting((value) => value.filter((item) => item !== id));
    }, 360);
  };
  const remove = (id) => {
    if (deleting.includes(id)) return;
    setDeleting((v) => [...v, id]);
    window.setTimeout(() => {
      setTasks((v) => v.filter((t) => t.id !== id));
      setDeleting((v) => v.filter((item) => item !== id));
    }, 180);
  };
  return (
    <>
      <div className="tasks">
        {tasks.length === 0 && (
          <div className="todo-empty-state">
            <span aria-hidden="true">
              <CheckCircle2 />
            </span>
            <b>今日暂无待办</b>
            <p>今天还没有需要处理的事情，可以轻松一点。</p>
          </div>
        )}
        {tasks.map((t) => {
          const realm = realmForTask(t);
          return <article
            className={`${t.done ? "done" : ""} ${completing.includes(t.id) ? "is-completing" : ""} ${deleting.includes(t.id) ? "is-deleting" : ""}`}
            data-realm={realm.name}
            style={{ "--task-color": realm.color, "--task-tint": realm.tint }}
            key={t.id}
          >
            <GripVertical className="drag" />
            <button
              className="task-check"
              onClick={() => toggle(t.id)}
              aria-label={`完成${t.title}`}
              disabled={completing.includes(t.id)}
            >
              <Check />
            </button>
            <button
              className="task-copy"
              onClick={() => openModal(`todoEdit-${t.id}`)}
            >
              <span className="task-title-line">
                <b>{t.title}</b>
                {t.level === "late" && <em>已逾期</em>}
              </span>
              <small>
                {t.tag} · {t.time}
              </small>
            </button>
            <button
              className="task-remove"
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                remove(t.id);
              }}
              aria-label={`删除${t.title}`}
            >
              <X />
            </button>
          </article>;
        })}
      </div>
      {tasks.length > 0 && (
        <button className="add-todo" onClick={() => openModal("addTodo")}>
          <Plus /> 添加待办
        </button>
      )}
      {!full && (
        <button className="more-page" onClick={() => openModal("gotoTodo")}>
          进入待办页面 <ChevronRight />
        </button>
      )}
    </>
  );
}

function ScheduleTodoPanel({
  tasks,
  setTasks,
  scheduled,
  selectedDateKey,
  navigate,
  openModal,
  mobileTimeline = false,
  sectionTitle = "今日待办",
  sectionSub = "",
  showAddAction = true,
}) {
  const [sortMode, setSortMode] = useState("manual"),
    [completing, setCompleting] = useState([]),
    [deleting, setDeleting] = useState([]),
    sortLabels = {
      manual: "手动",
      time: "按时间",
      realm: "按版图",
      status: "按状态",
    },
    todayKey = new Date().toLocaleDateString("en-CA"),
    matchesSelectedDate = (task) => {
      if (task.date) {
        if (taskOccursOnDate(task, selectedDateKey)) return true;
        // An unfinished one-off item rolls into Today instead of disappearing.
        return !task.repeat && !task.done && task.date < todayKey && selectedDateKey === todayKey;
      }
      if (/(?:今天|今晚)/.test(`${task.meta || ""} ${task.time || ""}`))
        return selectedDateKey === todayKey;
      return true;
    },
    active = tasks.filter(
      (t) =>
        !taskCompletedOnDate(t, selectedDateKey) &&
        !t.archived &&
        t.matterStatus !== "待安排" &&
        matchesSelectedDate(t),
    ),
    completed = tasks.filter(
      (t) => taskCompletedOnDate(t, selectedDateKey) && !t.archived && matchesSelectedDate(t),
    ),
    isTimed = (t) =>
      scheduled.some((s) => s.taskId === t.id) || /\d{1,2}:\d{2}/.test(t.time),
    rank = (t) => realms.findIndex((r) => r.directions.includes(t.tag)),
    sortItems = (items) => {
      const list = [...items];
      if (sortMode === "time")
        return list.sort((a, b) => a.time.localeCompare(b.time, "zh-CN"));
      if (sortMode === "realm") return list.sort((a, b) => rank(a) - rank(b));
      if (sortMode === "status")
        return list.sort((a, b) => (b.level === "late") - (a.level === "late"));
      return list;
    },
    progress = sortItems(active.filter(isTimed)),
    anytime = sortItems(active.filter((t) => !isTimed(t))),
    moveToAnytime = (e) => {
      e.preventDefault();
      try {
        const source = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (!source?.id) return;
        setTasks((current) =>
          current.map((item) =>
            item.id === source.id
              ? { ...item, date: selectedDateKey, clock: "", time: "随时待办" }
              : item,
          ),
        );
      } catch {}
    },
    reorderTask = (sourceId, targetId) => {
      if (sortMode !== "manual" || sourceId === targetId) return;
      setTasks((current) => {
        const next = [...current],
          from = next.findIndex((item) => item.id === sourceId),
          to = next.findIndex((item) => item.id === targetId);
        if (from < 0 || to < 0) return current;
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    },
    completeTask = (id) => {
      if (completing.includes(id)) return;
      setCompleting((v) => [...v, id]);
      window.setTimeout(() => {
        setTasks((v) => v.map((item) => {
          if (item.id !== id) return item;
          if (item.repeat) {
            return {
              ...item,
              done: false,
              completedAt: new Date().toISOString(),
              completedDates: [...new Set([...(item.completedDates || []), selectedDateKey])],
            };
          }
          return { ...item, done: true, matterStatus: "已完成", completedAt: new Date().toISOString() };
        }));
        setCompleting((v) => v.filter((item) => item !== id));
      }, 360);
    };
  const timelineClock = (task) => {
    const arranged = scheduled.find((item) => item.taskId === task.id);
    if (arranged) {
      const minutes = Math.round(Number(arranged.start) * 60);
      return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    }
    return task.clock || `${task.meta || ""} ${task.time || ""}`.match(/\d{1,2}:\d{2}/)?.[0] || "--:--";
  };
  const bindTaskTouch = useTouchReorder((source, target) => {
    if (sortMode === "manual") reorderTask(Number(source), Number(target));
  });
  const Cards = ({ items, timeline = false }) => (
    <div className={`tasks ${timeline ? "timed-task-timeline" : ""}`}>
      {items.map((t) => {
        const arranged = scheduled.some((s) => s.taskId === t.id),
          realm = realmForTask(t),
          isCompleting = completing.includes(t.id),
          isOverdue = taskIsOverdueOnDate(t, selectedDateKey);
        const card = (
          <article
            className={`${arranged ? "arranged " : ""}${isCompleting ? "is-completing" : ""}${deleting.includes(t.id) ? " is-deleting" : ""}`}
            data-touch-order={t.id}
            data-realm={realm.name}
            style={{
              "--task-color": realm?.color || "#8fa39a",
              "--task-tint": realm?.tint || "#f2f5f3",
            }}
            draggable={!isCompleting && !mobileTimeline}
            onDragStart={(e) => {
              livaDraggedTask = t;
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", JSON.stringify(t));
              e.dataTransfer.setData("application/x-liva-task", String(t.id));
            }}
            onDragEnd={() => { livaDraggedTask = null; }}
            onDragOver={(e) => {
              if (sortMode === "manual") e.preventDefault();
            }}
            onDrop={(e) => {
              if (sortMode !== "manual") return;
              e.preventDefault();
              try {
                const source = JSON.parse(
                  e.dataTransfer.getData("text/plain"),
                );
                if (items === anytime && isTimed(t)) {
                  moveToAnytime(e);
                  return;
                }
                reorderTask(source.id, t.id);
              } catch {}
            }}
            key={t.id}
          >
            <button
              className="drag"
              type="button"
              draggable={!isCompleting && !mobileTimeline}
              onDragStart={(e) => {
                e.stopPropagation();
                livaDraggedTask = t;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", JSON.stringify(t));
                e.dataTransfer.setData("application/x-liva-task", String(t.id));
              }}
              onDragEnd={() => { livaDraggedTask = null; }}
              aria-label={`拖动调整${t.title}顺序`}
              {...bindTaskTouch(t.id)}
            ><GripVertical /></button>
            <button
              className="task-check"
              onClick={() => completeTask(t.id)}
              aria-label={`完成${t.title}`}
              disabled={isCompleting}
            >
              <Check />
            </button>
            <button
              className="task-copy"
              onClick={() => navigate(`todoEdit-${t.id}`)}
            >
              <span className="task-title-line">
                <b>{t.title}</b>
                {isOverdue && <em>已逾期</em>}
              </span>
              <small>
                {t.tag} · {t.time}
              </small>
            </button>
            <button
              className="task-remove"
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (deleting.includes(t.id)) return;
                setDeleting((v) => [...v, t.id]);
                window.setTimeout(() => {
                  setTasks((current) => current.filter((item) => item.id !== t.id));
                  setDeleting((v) => v.filter((item) => item !== t.id));
                }, 180);
              }}
              aria-label={`删除${t.title}`}
            >
              <X />
            </button>
          </article>
        );
        return timeline ? (
          <div
            className="timed-task-row"
            style={{ "--task-color": realm?.color || "#8fa39a" }}
            key={`timeline-${t.id}`}
          >
            <time>{timelineClock(t)}</time>
            <span className="timed-task-node" aria-hidden="true" />
            {card}
          </div>
        ) : card;
      })}
    </div>
  );
  return (
    <Section
      id="today-todos"
      title={sectionTitle}
      sub={sectionSub}
      className="today-todo card-list-todo schedule-todos"
      action={showAddAction ? (
        <button className="quick-add-todo" onClick={() => openModal("addTodo")}>
          <Plus /> 新建待办
        </button>
      ) : null}
    >
      <div className="stats">
        <div>
          <b>{active.length}</b>
          <span>进行中</span>
        </div>
        <div>
          <b>{scheduled.length}</b>
          <span>已安排</span>
        </div>
        <div>
          <b>{completed.length}</b>
          <span>已完成</span>
        </div>
      </div>
      <div className="todo-sub">
        <span>{mobileTimeline && <CalendarDays aria-hidden="true" />} {mobileTimeline ? "定时待办" : "正在推进"}</span>
        <TodoSortControl mode={sortMode} setMode={setSortMode} labels={sortLabels} />
      </div>
      <div className="dashboard-task-scroll grouped-task-scroll">
        <Cards items={progress} timeline={mobileTimeline} />
        <div className="anytime-drop-zone" onDragOver={(e) => e.preventDefault()} onDrop={moveToAnytime}>
          <div className="anytime-heading">
            <span>{mobileTimeline && <NotebookPen aria-hidden="true" />} 随时待办</span>
          </div>
          <Cards items={anytime} />
        </div>
      </div>
      {completed.length > 0 && (
        <details className="completed-task-window">
          <summary>
            <span>
              <CheckCircle2 /> 已完成
            </span>
            <b>{completed.length}</b>
            <ChevronDown />
          </summary>
          <div>
            {completed.map((t) => (
              <article key={t.id}>
                <button
                  className="completed-check"
                  onClick={() =>
                    setTasks((v) =>
                      v.map((item) =>
                        item.id === t.id
                          ? item.repeat
                            ? {
                                ...item,
                                done: false,
                                completedDates: (item.completedDates || []).filter((date) => date !== selectedDateKey),
                              }
                            : { ...item, done: false, matterStatus: "进行中", completedAt: null }
                          : item,
                      ),
                    )
                  }
                  aria-label={`恢复${t.title}`}
                >
                  <Check />
                </button>
                <button onClick={() => navigate(`todoEdit-${t.id}`)}>
                  <b>{t.title}</b>
                  <small>
                    {t.tag} · {t.time}
                  </small>
                </button>
              </article>
            ))}
          </div>
        </details>
      )}
    </Section>
  );
}
function PlanningBoard({ tasks, setTasks, navigate, openModal, timelineOnly = false }) {
  const slotHeight = window.matchMedia?.("(max-width: 800px)").matches ? 48 : 64,
    hours = Array.from({ length: 24 }, (_, i) => i),
    scroller = useRef(null),
    datePicker = useRef(null),
    [now, setNow] = useState(() => new Date()),
    [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateKey = (d) => d.toLocaleDateString("en-CA"),
    todayKey = dateKey(now),
    selectedKey = dateKey(selectedDate),
    isToday = selectedKey === todayKey,
    nowMinutes = now.getHours() * 60 + now.getMinutes(),
    nowTop = (nowMinutes / 60) * slotHeight,
    nowLabel = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    dateLabel = `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`,
    axisTitle = isToday ? "今日时间轴" : `${dateLabel}时间轴`;
  const scheduled = tasks
    .filter((task) => {
      if (task.done || task.archived || taskMinuteValue(task) === null) return false;
      if (!task.date) return selectedKey === todayKey;
      return taskOccursOnDate(task, selectedKey);
    })
    .map((task) => {
      const minutes = taskMinuteValue(task);
      return {
        id: `${task.id}-${selectedKey}`,
        taskId: task.id,
        title: task.title,
        start: minutes / 60,
        duration: Math.max(0.5, Math.min(24 - minutes / 60, Number(task.durationHours) || 1)),
        dateKey: selectedKey,
      };
    });
  const focusNow = () =>
    requestAnimationFrame(() => {
      if (scroller.current)
        scroller.current.scrollTo({
          top: Math.max(0, nowTop - scroller.current.clientHeight * 0.42),
          behavior: "smooth",
        });
    });
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    focusNow();
    return () => clearInterval(timer);
  }, []);
  const changeDate = (amount) =>
      setSelectedDate((d) => {
        const next = new Date(d);
        next.setDate(next.getDate() + amount);
        return next;
      }),
    goToday = () => {
      setSelectedDate(new Date());
      focusNow();
    };
  const dayScheduled = scheduled.filter((s) => s.dateKey === selectedKey),
    timelineLayout = layoutTimelineItems(dayScheduled),
    formatTimelineClock = (start) => {
      const totalMinutes = Math.round(Number(start) * 60),
        hour = Math.floor(totalMinutes / 60),
        minute = totalMinutes % 60;
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    },
    drop = (e, hour) => {
      e.preventDefault();
      try {
        const transferred = e.dataTransfer.getData("text/plain"),
          t = transferred ? JSON.parse(transferred) : livaDraggedTask;
        if (!t?.id) return;
        const clock = formatTimelineClock(hour);
        setTasks((current) =>
          current.map((item) =>
            item.id === t.id
              ? {
                  ...item,
                  date: selectedKey,
                  clock,
                  time: `${selectedKey} ${clock}`,
                }
              : item,
          ),
        );
        livaDraggedTask = null;
      } catch {
        livaDraggedTask = null;
      }
    };
  const resize = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY,
      current = scheduled.find((s) => s.id === id);
    if (!current) return;
    const move = (ev) => {
      const change = Math.round((ev.clientY - startY) / (slotHeight / 2)) / 2;
      const duration = Math.max(0.5, Math.min(24 - current.start, current.duration + change));
      setTasks((items) => items.map((task) => task.id === current.taskId ? { ...task, durationHours: duration } : task));
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };
  const toneFor = (s) => {
    const task = tasks.find((t) => t.id === s.taskId);
    return realmForTask(task);
  };
  const dateControls = (
    <div className="axis-date-controls">
      <button onClick={() => changeDate(-1)} aria-label="前一天">
        <ChevronLeft />
      </button>
      <button
        type="button"
        className="axis-date-picker"
        onClick={() => {
          const picker = datePicker.current;
          if (!picker) return;
          if (picker.showPicker) picker.showPicker();
          else picker.click();
        }}
      >
        <CalendarDays />
        <span>{dateLabel}</span>
        <input
          ref={datePicker}
          type="date"
          value={selectedKey}
          onChange={(e) => {
            if (!e.target.value) return;
            setSelectedDate(new Date(`${e.target.value}T00:00:00`));
          }}
          aria-label="选择日期"
        />
      </button>
      <button onClick={() => changeDate(1)} aria-label="后一天">
        <ChevronRight />
      </button>
      <button className="today-shortcut" onClick={goToday} disabled={isToday}>
        今天
      </button>
    </div>
  );
  return (
    <div className={`bottom planning-board ${timelineOnly ? "timeline-only" : ""}`}>
      <Section
        title={axisTitle}
        className="timeline-panel full-axis"
        action={dateControls}
      >
        <div className="axis-scroll" ref={scroller}>
          <div
            className="axis-grid"
            style={{
              "--timeline-slot-height": `${slotHeight}px`,
              minHeight: `${hours.length * slotHeight}px`,
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              const block = e.target.closest?.(".scheduled-block"),
                blockStart = Number(block?.dataset.start),
                bounds = e.currentTarget.getBoundingClientRect(),
                pointerStart = Math.round(((e.clientY - bounds.top) / slotHeight) * 2) / 2,
                targetStart = Number.isFinite(blockStart)
                  ? blockStart
                  : Math.max(0, Math.min(23.5, pointerStart));
              drop(e, targetStart);
            }}
          >
            {hours.map((h) => (
              <div className={`hour-row ${h === 23 ? "last-hour-row" : ""}`} key={h}>
                <time>{String(h).padStart(2, "0")}:00</time>
                <i />
              </div>
            ))}
            {isToday && (
              <div
                className="current-time-line"
                style={{ top: nowTop }}
                aria-label={`当前时间 ${nowLabel}`}
              >
                <time>{nowLabel}</time>
                <span />
                <i />
              </div>
            )}
            {dayScheduled.map((s) => {
              const tone = toneFor(s),
                { lane: laneIndex = 0, laneCount = 1 } =
                  timelineLayout.get(s.id) || {},
                laneLeft = (laneIndex / laneCount) * 100,
                laneWidth = 100 / laneCount;
              return (
                <article
                  className="scheduled-block"
                  data-start={s.start}
                  data-realm={tone.name}
                  style={{
                    position: "absolute",
                    top: `${s.start * slotHeight + 2}px`,
                    height: `${Math.max(24, s.duration * slotHeight - 4)}px`,
                    "--schedule-color": tone.color,
                    "--schedule-tint": tone.tint,
                    left: `calc(48px + ${laneLeft}% - ${(laneLeft * 52) / 100}px)`,
                    right: "auto",
                    width: `calc(${laneWidth}% - ${52 / laneCount + 4}px)`,
                  }}
                  draggable
                  onDragStart={(e) => {
                    const task = tasks.find((item) => item.id === s.taskId);
                    if (!task) return;
                    livaDraggedTask = task;
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", JSON.stringify(task));
                  }}
                  onDragEnd={() => { livaDraggedTask = null; }}
                  key={s.id}
                >
                  <b>{s.title}</b>
                  <small>
                    {formatTimelineClock(s.start)} · {s.duration}小时
                  </small>
                  <button
                    className="resize-handle"
                    onMouseDown={(e) => resize(e, s.id)}
                    aria-label="调整时长"
                  />
                </article>
              );
            })}
          </div>
        </div>
      </Section>
      {timelineOnly && (
        <div className="mobile-timeline-task-panel">
          <ScheduleTodoPanel
            tasks={tasks}
            setTasks={setTasks}
            scheduled={dayScheduled}
            selectedDateKey={selectedKey}
            navigate={navigate}
            openModal={openModal}
            mobileTimeline
          />
        </div>
      )}
      {!timelineOnly && (
        <ScheduleTodoPanel
          tasks={tasks}
          setTasks={setTasks}
          scheduled={dayScheduled}
          selectedDateKey={selectedKey}
          navigate={navigate}
          openModal={openModal}
        />
      )}
    </div>
  );
}

function TodoSortControl({ mode, setMode, labels, className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`todo-sort-wrap ${className}`.trim()}>
      <button
        className="todo-sort-trigger"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="选择待办排序方式"
        aria-expanded={open}
      >
        <span>{labels[mode]}</span>
        <ChevronDown />
      </button>
      {open && (
        <div className="todo-sort-menu">
          {Object.entries(labels).map(([value, label]) => (
            <button
              className={mode === value ? "active" : ""}
              type="button"
              onClick={() => {
                setMode(value);
                setOpen(false);
              }}
              key={value}
            >
              <span>{label}</span>
              {mode === value && <Check />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function repeatChange(event, setRepeat, setRepeatInterval) {
  const value = event.target.value;
  if (value === "custom") setRepeatInterval((current) => current || 2);
  setRepeat(value);
}
function CustomRepeatFields({ interval, setInterval, unit, setUnit, weekdays, setWeekdays, mode, setMode }) {
  const weekNames = ["一", "二", "三", "四", "五", "六", "日"],
    weekDays = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div className="custom-repeat-fields">
      <div className="custom-repeat-mode">
        <button type="button" className={mode !== "weekdays" ? "active" : ""} onClick={() => setMode("interval")}>按间隔</button>
        <button type="button" className={mode === "weekdays" ? "active" : ""} onClick={() => { setMode("weekdays"); if (!weekdays.length) setWeekdays([new Date().getDay()]); }}>按星期</button>
      </div>
      {mode !== "weekdays" ? <div className="custom-repeat-interval">
        <span>每</span>
        <input type="number" min="1" step="1" value={interval} onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))} aria-label="重复间隔" />
        <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="重复单位">
          <option value="day">天</option><option value="week">周</option><option value="month">月</option><option value="year">年</option>
        </select>
      </div> : <div className="custom-repeat-weekdays">
        {weekNames.map((name, index) => {
          const day = weekDays[index];
          return <button type="button" className={weekdays.includes(day) ? "active" : ""} onClick={() => setWeekdays(weekdays.includes(day) ? weekdays.filter((v) => v !== day) : [...weekdays, day])} key={day}>{name}</button>;
        })}
      </div>}
    </div>
  );
}
function CircularProgress({ value, className = "" }) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <svg className={`circular-progress ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <circle className="circular-progress-track" cx="60" cy="60" r="51" pathLength="100" />
      <circle
        className="circular-progress-value"
        cx="60"
        cy="60"
        r="51"
        pathLength="100"
        strokeDasharray={`${progress} 100`}
      />
    </svg>
  );
}
function MobileOverview({ tasks, openModal, navigate }) {
  const active = tasks.filter((t) => !t.done && !t.archived),
    done = tasks.filter((t) => t.done && !t.archived),
    scheduled = active.filter((t) =>
      /\d{1,2}:\d{2}/.test(`${t.meta || ""} ${t.time || ""}`),
    ),
    visible = tasks.filter((t) => !t.archived),
    completion = visible.length
      ? Math.round((done.length / visible.length) * 100)
      : 0;
  const jumpTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="mobile-overview" aria-label="今日概览">
      <header className="mobile-dashboard-head">
        <h2>快捷概览</h2>
      </header>
      <div className="mobile-overview-stats">
        <button onClick={() => navigate("todo")}>
          <span>今日待办</span>
          <strong>{active.length}</strong>
          <small>正在推进</small>
          <i className="overview-card-mark" aria-hidden="true"><CheckCircle2 /></i>
        </button>
        <button className="completion-card" onClick={() => jumpTo("daily-review")}>
          <span>完成进度</span>
          <strong>{completion}%</strong>
          <small>{done.length} 项已完成</small>
          <i className="overview-card-mark completion-progress" aria-hidden="true">
            <CircularProgress value={completion} />
          </i>
        </button>
        <button onClick={() => navigate("todo")}>
          <span>定时待办</span>
          <strong>{scheduled.length}</strong>
          <small>个日程安排</small>
          <i className="overview-card-mark" aria-hidden="true"><CalendarDays /></i>
        </button>
        <button onClick={() => jumpTo("life-content")}>
          <span>生活关注</span>
          <strong>{matters.length}</strong>
          <small>个正在展开</small>
          <i className="overview-card-mark" aria-hidden="true"><ListChecks /></i>
        </button>
      </div>
      <button className="mobile-capture" onClick={() => openModal("addTodo")}>
        <Plus /> 记一件待办
      </button>
    </section>
  );
}

function TimeCompass({ tasks }) {
  const visible = tasks.filter((task) => !task.archived),
    completed = visible.filter((task) => task.done).length,
    arrangedTasks = visible.filter(
      (task) => !task.done && /\d{1,2}:\d{2}/.test(`${task.meta || ""} ${task.time || ""}`),
    ),
    arrangedHours = arrangedTasks.reduce(
      (total, task) => total + (Number(task.durationHours) || 1),
      0,
    ),
    availableHours = 16,
    freeHours = Math.max(0, availableHours - arrangedHours),
    percent = Math.min(100, Math.round((arrangedHours / availableHours) * 100)),
    hourLabel = (hours) => `${Number(hours.toFixed(1))}小时`;
  return (
    <section className="time-compass" aria-label="时间罗盘">
      <header>
        <h2>今日概览</h2>
      </header>
      <div className="time-compass-body">
        <div className="time-compass-ring">
          <CircularProgress value={percent} className="time-compass-progress" />
          <strong>{hourLabel(arrangedHours)}</strong>
          <span>已安排</span>
        </div>
        <div className="time-compass-legend">
          <p><i className="arranged" /><b>{hourLabel(arrangedHours)}</b><span>已安排时间</span></p>
          <p><i className="floating" /><b>{hourLabel(freeHours)}</b><span>可安排时间</span></p>
          <p><i className="completed" /><b>{completed}</b><span>已完成事项</span></p>
        </div>
      </div>
    </section>
  );
}

function TimelinePage({ navigate, openModal, tasks, setTasks }) {
  return (
    <div className="timeline-page-shell">
      <Header title="时间轴" openModal={openModal} navigate={navigate} />
      <PlanningBoard
        tasks={tasks}
        setTasks={setTasks}
        navigate={navigate}
        openModal={openModal}
        timelineOnly
      />
      <TimeCompass tasks={tasks} />
    </div>
  );
}

function Dashboard({ navigate, openModal, tasks, setTasks, realmVersion }) {
  const [orderedRealms, setOrderedRealms] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("liva-realm-order") || "[]");
    return [...realms].sort((a, b) => {
      const ai = saved.indexOf(a.name), bi = saved.indexOf(b.name);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
  });
  const [draggedRealm, setDraggedRealm] = useState(null);
  const moveRealm = (source, target) => setOrderedRealms((current) => {
    const next = [...current], from = next.findIndex((r) => r.name === source), to = next.findIndex((r) => r.name === target);
    if (from < 0 || to < 0) return current;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    localStorage.setItem("liva-realm-order", JSON.stringify(next.map((r) => r.name)));
    return next;
  });
  const bindRealmTouch = useTouchReorder(moveRealm);
  const reorderRealm = (to) => {
    if (draggedRealm === null || draggedRealm === to) return;
    setOrderedRealms((current) => {
      const next = [...current], [moved] = next.splice(draggedRealm, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedRealm(null);
  };
  return (
    <>
      <div id="dashboard-top">
        <Header openModal={openModal} navigate={navigate} />
      </div>
      <MobileOverview tasks={tasks} openModal={openModal} navigate={navigate} />
      <Section
        id="life-map"
        title="人生版图"
        sub="四个生活板块，以及它们正在容纳的事项"
        action={
          <button className="outline" onClick={() => openModal("addRealm")}>
            <Plus /> 新建版图
          </button>
        }
      >
        <div className="realms">
          {orderedRealms.map((r, i) => (
            <div className="draggable-board-card" data-touch-order={r.name} {...bindRealmTouch(r.name)} draggable onDragStart={(e) => {
              setDraggedRealm(i);
              e.dataTransfer.effectAllowed = "move";
            }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
              e.preventDefault();
              reorderRealm(i);
            }} onDragEnd={() => setDraggedRealm(null)} key={r.name}>
              <RealmCard
                realm={r}
                matters={matters}
                index={realms.findIndex((item) => item.name === r.name)}
                openModal={openModal}
              />
            </div>
          ))}
        </div>
      </Section>
      <Section
        id="life-content"
        title="生活事项"
        sub="记录长期关注，也安放当下想做的事"
        action={
          <button
            className="outline matter-add"
            onClick={() => openModal("addDirection")}
          >
            <Plus /> 新建事项
          </button>
        }
      >
        <LinkedMatters
          openModal={openModal}
          tasks={tasks}
          refreshVersion={realmVersion}
        />
      </Section>
      <div id="today-plan">
        <PlanningBoard
          tasks={tasks}
          setTasks={setTasks}
          navigate={navigate}
          openModal={openModal}
        />
      </div>
      <LifeReview tasks={tasks} navigate={navigate} />
    </>
  );
}

function MapPage({ navigate, openModal }) {
  return (
    <>
      <Header title="人生版图" openModal={openModal} navigate={navigate} />
      <div className="page-intro">
        <span>生活事项</span>
        <h1>
          这里不是目标清单，
          <br />
          只是生活展开的几种方式。
        </h1>
        <p>
          板块帮助你理解自己正在关心什么。事项可以出现、变化或暂时沉睡，不需要被完成。
        </p>
      </div>
      <div className="map-page-grid">
        {realms.map((r, i) => {
          const Icon = r.Icon;
          return (
            <article data-realm={r.name} style={{ "--c": r.color, "--t": r.tint }} key={r.name}>
              <header>
                <span>
                  <Icon />
                </span>
                <div>
                  <h2>{r.name}</h2>
                  <p>{getRealmNote(r)}</p>
                </div>
                <button onClick={() => navigate(`realm-${i}`)}>
                  <ChevronRight />
                </button>
              </header>
              <p className="realm-intro">{r.intro}</p>
              <div className="direction-list">
                {r.directions.map((d) => (
                  <button key={d} onClick={() => navigate("matters")}>
                    <i />
                    {d}
                    <ChevronRight />
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
function RealmPage({ realm, navigate, openModal }) {
  const Icon = realm.Icon;
  const [directions, setDirections] = useState(() => [...realm.directions]);
  const [draggedDirection, setDraggedDirection] = useState(null);
  const reorderDirection = (to) => {
    if (draggedDirection === null || draggedDirection === to) return;
    setDirections((current) => {
      const next = [...current], [moved] = next.splice(draggedDirection, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedDirection(null);
  };
  return (
    <div className="focus-page realm-focus-page" data-realm={realm.name} style={{ "--c": realm.color, "--t": realm.tint }}>
      <Header title={realm.name} openModal={openModal} navigate={navigate} />
      <button className="back" onClick={() => navigate("map")}>
        <ChevronLeft /> 返回版图
      </button>
      <section
        className="realm-hero"
        style={{ "--c": realm.color, "--t": realm.tint }}
      >
        <span>
          <Icon />
        </span>
        <p>{getRealmNote(realm)}</p>
        <h1>{realm.intro}</h1>
      </section>
      <Section
        title="这个板块包含的事项"
        sub="它们是内容的索引，不是必须完成的目标"
      >
        <div className="direction-detail">
          {directions.map((d, i) => (
            <article draggable onDragStart={(e) => { setDraggedDirection(i); e.dataTransfer.effectAllowed = "move"; }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); reorderDirection(i); }} onDragEnd={() => setDraggedDirection(null)} key={d}>
              <span>0{i + 1}</span>
              <h3>{d}</h3>
              <p>
                {
                  [
                    "最近的想法、相关资料与正在发生的事情，都可以放在这里。",
                    "保留过程和感受，允许它根据生活状态自然变化。",
                  ][i % 2]
                }
              </p>
              <button onClick={() => navigate("matters")}>
                查看相关事项 <ChevronRight />
              </button>
            </article>
          ))}
        </div>
      </Section>
      <Section title="最近留下的内容" sub="关于这个板块的片段与记录">
        <div className="notes-grid">
          <button onClick={() => openModal("note")}>
            <Plus />
            <b>写一条新记录</b>
            <small>想法、感受或一个小发现</small>
          </button>
          <article>
            <time>8月8日</time>
            <p>最近开始更在意过程是否舒服，而不是有没有明显结果。</p>
          </article>
          <article>
            <time>8月3日</time>
            <p>有些事项暂时不动，也不代表它们被放弃了。</p>
          </article>
        </div>
      </Section>
    </div>
  );
}
function MattersPage({ navigate, openModal, tasks = [] }) {
  const [orderedMatters, setOrderedMatters] = useState(() => matters.filter((item) => item.state === "点亮" && !item.archived));
  const [draggedMatter, setDraggedMatter] = useState(null),
    [activeRealm, setActiveRealm] = useState("全部"),
    visibleMatters = activeRealm === "全部"
      ? orderedMatters
      : orderedMatters.filter((item) => item.realm === activeRealm),
    matterId = (item) => `${item.realm}:${item.title}`,
    routineMatters = matters.filter((item) => item.kind === "日常习惯" && !item.archived),
    recentMemos = inspirationMemos.slice(0, 3);
  const reorderMatter = (targetMatter) => {
    const targetId = matterId(targetMatter);
    if (draggedMatter === null || draggedMatter === targetId) return;
    setOrderedMatters((current) => {
      const next = [...current],
        from = next.findIndex((item) => matterId(item) === draggedMatter),
        to = next.findIndex((item) => matterId(item) === targetId);
      if (from < 0 || to < 0) return current;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedMatter(null);
  };
  return (
    <div className="focus-page matters-focus-page">
      <Header title="事项与日常" openModal={openModal} navigate={navigate} />
      <button className="back matters-page-back" onClick={() => navigate("today")}>
        <ChevronLeft /> 返回首页
      </button>
      <div className="page-intro compact life-intro">
        <span>生活近况</span>
        <h1>整理正在发生的生活。</h1>
        <p>
          这里不衡量完成，也不催促结果。只是把事项、内容和最近的感受放在容易找到的地方。
        </p>
      </div>
      <section className="life-overview">
        <div>
          <b>7</b>
          <span>正在展开的事项</span>
        </div>
        <div>
          <b>4</b>
          <span>生活板块</span>
        </div>
        <div>
          <b>12</b>
          <span>最近留下的内容</span>
        </div>
        <p>
          <Sparkles /> 最近更常回到“身体与美感”，也收集了不少旅行灵感。
        </p>
      </section>
      <div className="filter-row life-filters">
        <button className={activeRealm === "全部" ? "active" : ""} aria-pressed={activeRealm === "全部"} onClick={() => setActiveRealm("全部")}>全部</button>
        {realms.map((r) => (
          <button style={{ "--filter-color": r.color }} className={activeRealm === r.name ? "active" : ""} aria-pressed={activeRealm === r.name} onClick={() => setActiveRealm(r.name)} key={r.name}>{r.name}</button>
        ))}
      </div>
      <div className="life-management">
        <main>
          <div className="content-heading">
            <div>
              <h2>正在展开</h2>
              <p>按当下状态自然排列</p>
            </div>
            <button>
              <ChevronDown /> 最近关注
            </button>
          </div>
          <div className="matter-board life-board">
            {visibleMatters.map((m) => {
              const index = matters.findIndex((item) => item.title === m.title && item.realm === m.realm);
              const r = realms.find((x) => x.name === m.realm),
                Icon = m.Icon;
              return (
                <article draggable onDragStart={(e) => { setDraggedMatter(matterId(m)); e.dataTransfer.effectAllowed = "move"; }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); reorderMatter(m); }} onDragEnd={() => setDraggedMatter(null)}
                  style={{ "--c": r.color, "--t": r.tint }}
                  key={m.title}
                  onClick={() => openModal(`content-${index}`)}
                >
                  <header>
                    <span>
                      <Icon />
                    </span>
                    <i>{m.realm}</i>
                    <button>
                      <MoreHorizontal />
                    </button>
                  </header>
                  <h2>{m.title}</h2>
                  <p>{m.note}</p>
                  <div className="content-tags">
                    <span>相关记录</span>
                    <span>灵感与资料</span>
                  </div>
                  <footer>
                    <span>{m.state}</span>
                    <button>
                      查看内容 <ChevronRight />
                    </button>
                  </footer>
                </article>
              );
            })}
            {visibleMatters.length === 0 && (
              <div className="matter-filter-empty">这个版图暂时没有正在展开的事项</div>
            )}
          </div>
        </main>
        <aside className="life-aside">
          <section>
            <header>
              <div><h3>日常事项</h3><p>汇总已有的日常习惯</p></div>
            </header>
            {routineMatters.length ? routineMatters.map((matter) => {
              const Icon = matter.Icon,
                index = matters.indexOf(matter),
                pending = tasks.filter((task) => task.tag === matter.title && !task.done && !task.archived).length,
                realm = realms.find((item) => item.name === matter.realm);
              return (
                <button className="aside-data-row" style={{ "--c": realm?.color, "--t": realm?.tint }} onClick={() => openModal(`content-${index}`)} key={`${matter.realm}-${matter.title}`}>
                  <span><Icon /></span>
                  <div><b>{matter.title}</b><small>{matter.realm} · {pending} 个待办</small></div>
                  <ChevronRight />
                </button>
              );
            }) : <p className="aside-data-empty">暂无日常习惯事项</p>}
          </section>
          <section>
            <header>
              <div><h3>最近记录</h3><p>来自已有的灵感与生活记录</p></div>
              <button onClick={() => openModal("note")} aria-label="记录灵感"><Plus /></button>
            </header>
            {recentMemos.length ? recentMemos.map((memo) => (
              <button className="record-summary-row" onClick={() => openModal("note")} key={memo.id}>
                <span><Lightbulb /></span>
                <div><b>{memo.text}</b><small>{memo.time}{memo.done ? " · 已整理" : ""}</small></div>
                <ChevronRight />
              </button>
            )) : <p className="aside-data-empty">还没有留下记录</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
function TodoPage({ navigate, openModal, tasks, setTasks }) {
  const [sortMode, setSortMode] = useState("time"),
    [mobileSelectedDate, setMobileSelectedDate] = useState(() => new Date()),
    mobileDateInput = useRef(null),
    sortLabels = { time: "按时间", realm: "按版图", status: "按状态" },
    isMobile = window.matchMedia?.("(max-width: 800px)").matches,
    todayKey = new Date().toLocaleDateString("en-CA"),
    mobileSelectedKey = mobileSelectedDate.toLocaleDateString("en-CA"),
    selectedDateKey = isMobile ? mobileSelectedKey : todayKey,
    mobileSelectedLabel = `${mobileSelectedDate.getMonth() + 1}月${mobileSelectedDate.getDate()}日 · 周${["日", "一", "二", "三", "四", "五", "六"][mobileSelectedDate.getDay()]}${mobileSelectedKey === todayKey ? " · 今天" : ""}`,
    weekStart = (() => {
      const date = new Date(mobileSelectedDate), day = date.getDay() || 7;
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - day + 1);
      return date;
    })(),
    mobileWeekDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    }),
    rawVisibleTasks = tasks.filter(
      (t) => !t.archived && Boolean(t.date) && taskOccursOnDate(t, selectedDateKey),
    ),
    taskClock = (task) =>
      task.clock || `${task.meta || ""} ${task.time || ""}`.match(/\d{1,2}:\d{2}/)?.[0] || "99:99",
    visibleTasks = [...rawVisibleTasks].sort((a, b) => {
      if (sortMode === "realm")
        return realms.findIndex((realm) => realm.name === realmForTask(a).name) -
          realms.findIndex((realm) => realm.name === realmForTask(b).name);
      if (sortMode === "status")
        return Number(taskCompletedOnDate(a, selectedDateKey)) - Number(taskCompletedOnDate(b, selectedDateKey)) || Number(taskIsOverdueOnDate(b, selectedDateKey)) - Number(taskIsOverdueOnDate(a, selectedDateKey));
      return taskClock(a).localeCompare(taskClock(b), "zh-CN", { numeric: true });
    }),
    arrangedSource = isMobile
      ? tasks.filter((task) => {
          if (taskCompletedOnDate(task, selectedDateKey) || task.archived) return false;
          if (task.date) return taskOccursOnDate(task, selectedDateKey);
          return /(?:今天|今晚)/.test(`${task.meta || ""} ${task.time || ""}`) && selectedDateKey === todayKey;
        })
      : visibleTasks,
    arrangedTasks = arrangedSource.filter(
      (t) => !taskCompletedOnDate(t, selectedDateKey) && /\d{1,2}:\d{2}/.test(`${t.meta || ""} ${t.time || ""}`),
    ),
    mobileScheduled = arrangedTasks.map((task) => ({
      id: task.id,
      taskId: task.id,
      title: task.title,
      start: Number((task.clock || taskClock(task)).split(":")[0]) + Number((task.clock || taskClock(task)).split(":")[1] || 0) / 60,
      duration: task.durationHours || 1,
      dateKey: selectedDateKey,
    }));
  if (isMobile) {
    return (
      <div className="todo-page-shell mobile-todo-timeline-page">
        <Header
          title="待办事项"
          mobileTitle="下午好， May"
          openModal={openModal}
          navigate={navigate}
        />
        <div className="todo-page-head">
          <div>
            <span>今天</span>
            <h1>待办事项</h1>
            <p>按时间看清今天，也给随时可做的事留一点余地。</p>
          </div>
          <button onClick={() => openModal("addTodo")}>
            <Plus /> 新建待办
          </button>
        </div>
        <div className="mobile-todo-timeline-list">
          <div className="mobile-week-picker">
            <div className="mobile-week-days" role="group" aria-label="选择日期">
              {mobileWeekDays.map((date) => {
                const key = date.toLocaleDateString("en-CA"),
                  selected = key === mobileSelectedKey;
                return (
                  <button
                    type="button"
                    className={selected ? "active" : ""}
                    onClick={() => setMobileSelectedDate(new Date(date))}
                    aria-pressed={selected}
                    key={key}
                  >
                    <span>{["日", "一", "二", "三", "四", "五", "六"][date.getDay()]}</span>
                    <b>{date.getDate()}</b>
                  </button>
                );
              })}
            </div>
            <button className="mobile-calendar-trigger" type="button" tabIndex="-1" aria-hidden="true">
              <CalendarDays />
            </button>
            <input
              ref={mobileDateInput}
              className="mobile-calendar-input"
              type="date"
              value={mobileSelectedKey}
              onChange={(event) => {
                if (event.target.value) setMobileSelectedDate(new Date(`${event.target.value}T12:00:00`));
              }}
              aria-label="打开日期选择"
            />
          </div>
          <ScheduleTodoPanel
            tasks={tasks}
            setTasks={setTasks}
            scheduled={mobileScheduled}
            selectedDateKey={selectedDateKey}
            navigate={navigate}
            openModal={openModal}
            mobileTimeline
            sectionTitle="每日概览"
            sectionSub={mobileSelectedLabel}
            showAddAction={false}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="todo-page-shell">
      <Header
        title="待办事项"
        mobileTitle="下午好， May"
        openModal={openModal}
        navigate={navigate}
      />
      <div className="todo-page-head">
        <div>
          <span>今天</span>
          <h1>待办事项</h1>
          <p>只放需要被提醒的具体事情，其余生活不必都变成任务。</p>
        </div>
        <button onClick={() => openModal("addTodo")}>
          <Plus /> 新建待办
        </button>
      </div>
      <div className="todo-layout">
        <aside>
          <button className="active">
            今天 <b>{visibleTasks.length}</b>
          </button>
          <button>
            即将到来 <b>3</b>
          </button>
          <button>
            收集箱 <b>2</b>
          </button>
          <hr />
          <h3>按领域</h3>
          {realms.map((r) => (
            <button key={r.name}>
              <i style={{ background: r.color }} />
              {r.name}
            </button>
          ))}
        </aside>
        <Section
          title="今日概览"
          sub={todayKey}
          action={
            <TodoSortControl
              mode={sortMode}
              setMode={setSortMode}
              labels={sortLabels}
              className="todo-page-sort"
            />
          }
        >
          <div className="stats">
            <div>
              <b>{visibleTasks.filter((t) => !t.done).length}</b>
              <span>进行中</span>
            </div>
            <div>
              <b>{arrangedTasks.length}</b>
              <span>已安排</span>
            </div>
            <div>
              <b>{visibleTasks.filter((t) => t.done).length}</b>
              <span>已完成</span>
            </div>
          </div>
          <TodoList
            tasks={isMobile ? visibleTasks.filter((task) => !task.done) : visibleTasks}
            setTasks={setTasks}
            openModal={openModal}
            full
          />
        </Section>
      </div>
    </div>
  );
}
function ProfilePage({ navigate, openModal }) {
  const { profile } = useLivaProfile();
  const rows = [
      {
        title: "生活记录",
        desc: "回看内容与生活片段",
        icon: CheckCircle2,
        action: () => navigate("matters"),
        tone: "green",
      },
      {
        title: "账户与同步",
        desc: "管理账号信息与多端同步",
        icon: RefreshCw,
        action: () => openModal("sync"),
        tone: "blue",
      },
      {
        title: "归档内容",
        desc: "查看暂时收起的事项与内容",
        icon: Archive,
        action: () => openModal("archive"),
        tone: "amber",
      },
    ],
    settings = [
      {
        title: "外观与偏好",
        desc: "调整主题、颜色与显示方式",
        icon: Palette,
        action: () => openModal("settings"),
        tone: "violet",
      },
      {
        title: "通知设置",
        desc: "选择希望收到的生活提醒",
        icon: Bell,
        action: () => openModal("notice"),
        tone: "rose",
      },
      {
        title: "帮助与反馈",
        desc: "使用帮助、常见问题与建议",
        icon: CircleHelp,
        action: () => openModal("help"),
        tone: "blue",
      },
    ];
  const List = ({ items }) => (
    <div className="profile-list">
      {items.map(({ title, desc, icon: Icon, action, tone }) => (
        <button key={title} onClick={action}>
          <span className={tone}>
            <Icon />
          </span>
          <div>
            <b>{title}</b>
            <small>{desc}</small>
          </div>
          <ChevronRight />
        </button>
      ))}
    </div>
  );
  return (
    <div className="profile-page-shell">
      <Header title="我的空间" openModal={openModal} navigate={navigate} />
      <div className="profile-wrap">
        <button className="back profile-back" onClick={() => navigate("today")}>
          <ChevronLeft /> 返回今日
        </button>
        <header className="profile-heading">
          <div>
            <h1>我的</h1>
            <p>管理你的个人空间与应用设置</p>
          </div>
        </header>
        <section className="profile-card">
          <span className="profile-avatar">{profile.initials}</span>
          <div>
            <h2>{profile.name}</h2>
            <p>{profile.bio}</p>
          </div>
          <button onClick={() => openModal("profile")}>编辑资料</button>
        </section>
        <section className="profile-group">
          <h3>个人空间</h3>
          <List items={rows} />
        </section>
        <section className="profile-group">
          <h3>应用设置</h3>
          <List items={settings} />
        </section>
      </div>
    </div>
  );
}
function ProfilePanel({ close, openModal, tasks = [], setTasks, onDataChange, user, onSignOut, initialView = "home" }) {
  const { profile } = useLivaProfile();
  const [view, setView] = useState(initialView),
    [density, setDensity] = useState(savedAppearance.density),
    [theme, setTheme] = useState(savedAppearance.theme),
    [notifications, setNotifications] = useState({
      todo: true,
      review: true,
      sync: savedAppearance.followSystem,
    }),
    [feedback, setFeedback] = useState(""),
    [recordRealm, setRecordRealm] = useState("全部"),
    groups = [
      {
        title: "个人空间",
        items: [
          [
            "records",
            "生活记录",
            "回看最近留下的生活片段",
            CheckCircle2,
            "green",
          ],
          ["sync", "账户与同步", "登录后同步多端生活数据", Cloud, "blue"],
          ["archive", "归档内容", "查看暂时收起的内容", Archive, "amber"],
        ],
      },
      {
        title: "应用设置",
        items: [
          ["appearance", "外观与偏好", "调整颜色与显示方式", Palette, "violet"],
          ["notifications", "通知设置", "选择希望收到的提醒", Bell, "rose"],
          ["help", "帮助与反馈", "查看帮助或留下建议", CircleHelp, "blue"],
        ],
      },
    ],
    titles = {
      records: "生活记录",
      sync: "账户与同步",
      archive: "归档内容",
      appearance: "外观与偏好",
      notifications: "通知设置",
      help: "帮助与反馈",
    },
    activeTasks = tasks.filter((t) => !t.done && !t.archived).length,
    doneTasks = tasks.filter((t) => t.done && !t.archived).length,
    archivedTasks = tasks.filter((t) => t.archived),
    archivedMatters = matters.filter((m) => m.archived),
    visibleRecordMatters = matters.filter((matter) => !matter.archived && (recordRealm === "全部" || matter.realm === recordRealm));
  const restoreMatter = (matter) => {
    matter.archived = false;
    setTasks?.((current) => current.map((task) => task.tag === matter.title ? { ...task, archived: false } : task));
    onDataChange?.();
    setView("archive");
  };
  const toggle = (id) => setNotifications((v) => ({ ...v, [id]: !v[id] })),
    BackHeader = () => (
      <header className="profile-subhead">
        <button onClick={() => setView("home")} aria-label="返回我的空间">
          <ChevronLeft />
        </button>
        <div>
          <small>我的空间</small>
          <h2>{titles[view]}</h2>
        </div>
        <button onClick={close} aria-label="关闭">
          <X />
        </button>
      </header>
    ),
    Home = () => (
      <>
        <header>
          <div>
            <h2>我的空间</h2>
          </div>
          <button onClick={close}>
            <X />
          </button>
        </header>
        <div className="profile-panel-scroll">
          <section className="profile-panel-card">
            <span>{profile.initials}</span>
            <div>
              <b>{profile.name}</b>
            <small>{user ? user.email : "登录后可在不同设备同步生活数据"}</small>
            </div>
            <div className="profile-panel-actions">
              <button onClick={() => openModal("profile")}>编辑资料</button>
              <button
                className="profile-login-button"
                onClick={() => !user && openModal("login")}
                disabled={Boolean(user)}
              >
                {user ? "已登录" : <><LogIn /> 登录并同步</>}
              </button>
            </div>
          </section>
          {groups.map((group) => (
            <section className="profile-panel-group" key={group.title}>
              <h3>{group.title}</h3>
              <div>
                {group.items.map(([id, title, desc, Icon, tone]) => (
                  <button key={id} onClick={() => setView(id)}>
                    <span className={tone}>
                      <Icon />
                    </span>
                    <p>
                      <b>{title}</b>
                      <small>{desc}</small>
                    </p>
                    <ChevronRight />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </>
    ),
    Records = () => (
      <div className="profile-panel-scroll profile-subpage">
        <section className="recent-matter-filter">
          <header><div><h3>最近事项</h3><p>按版图筛选近期关注的事项</p></div></header>
          <div className="record-realm-filters">
            <button className={recordRealm === "全部" ? "active" : ""} onClick={() => setRecordRealm("全部")}>全部</button>
            {realms.map((realm) => <button className={recordRealm === realm.name ? "active" : ""} style={{ "--c": realm.color, "--t": realm.tint }} onClick={() => setRecordRealm(realm.name)} key={realm.name}>{realm.name}</button>)}
          </div>
          <div className="recent-matter-list">
            {visibleRecordMatters.map((matter) => {
              const Icon = matter.Icon,
                index = matters.indexOf(matter),
                realm = realms.find((item) => item.name === matter.realm);
              return <button style={{ "--c": realm?.color, "--t": realm?.tint }} onClick={() => openModal(`content-${index}`)} key={`${matter.realm}-${matter.title}`}><span><Icon /></span><div><b>{matter.title}</b><small>{matter.realm} · {matter.state}</small></div><ChevronRight /></button>;
            })}
            {!visibleRecordMatters.length && <p className="space-empty">这个版图暂无事项</p>}
          </div>
        </section>
        <section className="space-section">
          <header>
            <div>
              <h3>最近留下</h3>
              <p>按时间回看生活里的变化</p>
            </div>
            <button>
              全部记录 <ChevronDown />
            </button>
          </header>
          <div className="record-timeline">
            <article>
              <i />
              <div>
                <time>今天</time>
                <b>整理了今日待办</b>
                <p>{activeTasks} 件事情正在稳步推进。</p>
              </div>
            </article>
            <article>
              <i />
              <div>
                <time>昨天</time>
                <b>留下了一条生活记录</b>
                <p>有些变化很小，但值得被看见。</p>
              </div>
            </article>
            <article>
              <i />
              <div>
                <time>8月11日</time>
                <b>更新了生活版图</b>
                <p>重新整理了近期关注的事项。</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    ),
    Sync = () => (
      <div className="profile-panel-scroll profile-subpage">
        <section className="sync-hero">
          <span>
            <Cloud />
          </span>
          <h3>让生活数据跟着你</h3>
          <p>登录后，版图、事项、待办与记录会安全同步到你的个人空间。</p>
          <button onClick={() => openModal("login")}>
            <LogIn /> 登录并开始同步
          </button>
        </section>
        <section className="space-section sync-features">
          <div>
            <CheckCircle2 />
            <p>
              <b>自动同步</b>
              <small>修改后自动保存，无需手动操作</small>
            </p>
          </div>
          <div>
            <RefreshCw />
            <p>
              <b>跨设备继续</b>
              <small>在不同设备查看同一份生活数据</small>
            </p>
          </div>
          <div>
            <Archive />
            <p>
              <b>安全保留</b>
              <small>归档内容和历史记录不会丢失</small>
            </p>
          </div>
        </section>
      </div>
    ),
    ArchiveView = () => (
      <div className="profile-panel-scroll profile-subpage">
        <div className="archive-summary">
          <Archive />
          <div>
            <b>
              {archivedTasks.length + archivedMatters.length}{" "}
              项归档内容
            </b>
            <small>归档只是暂时收起，随时可以恢复</small>
          </div>
        </div>
        <section className="space-section">
          <header>
            <div>
              <h3>已归档事项</h3>
              <p>结束的事项会整理在这里</p>
            </div>
          </header>
          <div className="archive-list">
            {archivedMatters.length ? (
              archivedMatters
                .map((m) => (
                  <article key={m.title}>
                    <span>
                      <Archive />
                    </span>
                    <div>
                      <b>{m.title}</b>
                      <small>{m.realm} · 已结束</small>
                    </div>
                    <button onClick={() => restoreMatter(m)}>恢复</button>
                  </article>
                ))
            ) : (
              <p className="space-empty">暂时没有已归档事项</p>
            )}
          </div>
        </section>
        <section className="space-section">
          <header>
            <div>
              <h3>已归档待办</h3>
              <p>与结束事项关联的待办</p>
            </div>
          </header>
          <div className="archive-list">
            {archivedTasks.length ? (
              archivedTasks.map((t) => (
                <article key={t.id}>
                  <span>
                    <ListChecks />
                  </span>
                  <div>
                    <b>{t.title}</b>
                    <small>{t.tag}</small>
                  </div>
                  <button>查看</button>
                </article>
              ))
            ) : (
              <p className="space-empty">暂时没有已归档待办</p>
            )}
          </div>
        </section>
      </div>
    ),
    Appearance = () => (
      <div className="profile-panel-scroll profile-subpage">
        <section className="space-section">
          <header>
            <div>
              <h3>界面主题</h3>
              <p>选择更适合当下的视觉气质</p>
            </div>
          </header>
          <div className="theme-options">
            {["自然", "暖白", "静夜"].map((name, i) => (
              <button
                className={theme === name ? "active" : ""}
                onClick={() => {
                  setTheme(name);
                  applyAppearance(name, density, false);
                }}
                key={name}
              >
                <i className={"theme-" + i} />
                <span>{name}</span>
                {theme === name && <Check />}
              </button>
            ))}
          </div>
        </section>
        <section className="space-section">
          <header>
            <div>
              <h3>显示密度</h3>
              <p>调整内容之间的呼吸感</p>
            </div>
          </header>
          <div className="segment-control">
            {["紧凑", "舒适", "宽松"].map((name) => (
              <button
                className={density === name ? "active" : ""}
                onClick={() => {
                  setDensity(name);
                  applyAppearance(theme, name, notifications.sync);
                }}
                key={name}
              >
                {name}
              </button>
            ))}
          </div>
        </section>
        <section className="space-section preference-row">
          <div>
            <Settings2 />
            <p>
              <b>跟随系统外观</b>
              <small>自动适应设备显示设置</small>
            </p>
          </div>
          <button
            className={"space-switch " + (notifications.sync ? "on" : "")}
            onClick={() => {
              const next = !notifications.sync;
              toggle("sync");
              applyAppearance(theme, density, next);
            }}
            aria-label="跟随系统外观"
          >
            <i />
          </button>
        </section>
      </div>
    ),
    Notifications = () => (
      <div className="profile-panel-scroll profile-subpage">
        <section className="space-section notification-settings">
          <h3>提醒类型</h3>
          {[
            ["todo", "待办提醒", "在设定时间提醒需要处理的事情", ListChecks],
            ["review", "每日回顾", "每天晚上提醒你简单回看今天", CheckCircle2],
            ["sync", "同步动态", "在其他设备完成同步时通知", Cloud],
          ].map(([id, title, desc, Icon]) => (
            <div className="setting-row" key={id}>
              <span>
                <Icon />
              </span>
              <p>
                <b>{title}</b>
                <small>{desc}</small>
              </p>
              <button
                className={"space-switch " + (notifications[id] ? "on" : "")}
                onClick={() => toggle(id)}
                aria-label={title}
              >
                <i />
              </button>
            </div>
          ))}
        </section>
        <p className="settings-note">
          <Bell /> 提醒只用于你主动开启的内容，不会打扰未安排的生活事项。
        </p>
      </div>
    ),
    Help = () => (
      <div className="profile-panel-scroll profile-subpage">
        <section className="space-section">
          <header>
            <div>
              <h3>常见问题</h3>
              <p>快速了解 Liva 的使用方式</p>
            </div>
          </header>
          <div className="faq-list">
            {[
              "版图、事项和待办有什么区别？",
              "结束的事项去了哪里？",
              "如何安排有明确时间的待办？",
            ].map((q) => (
              <button key={q}>
                <span>{q}</span>
                <ChevronRight />
              </button>
            ))}
          </div>
        </section>
        <section className="space-section feedback-box">
          <header>
            <div>
              <h3>告诉我们你的想法</h3>
              <p>问题、建议或想要的新功能都可以</p>
            </div>
          </header>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="写下你的建议…"
          />
          <button disabled={!feedback.trim()} onClick={() => setFeedback("")}>
            <MessageCircle /> 提交反馈
          </button>
        </section>
      </div>
    );
  let Content =
    view === "records" ? (
      <Records />
    ) : view === "sync" ? (
      <Sync />
    ) : view === "archive" ? (
      <ArchiveView />
    ) : view === "appearance" ? (
      <Appearance />
    ) : view === "notifications" ? (
      <Notifications />
    ) : view === "help" ? (
      <Help />
    ) : null;
  return (
    <div className="notice-backdrop" onClick={close}>
      <aside
        className="notification-panel profile-panel enhanced-profile-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {view === "home" ? (
          <Home />
        ) : (
          <>
            <BackHeader />
            {Content}
          </>
        )}
        <footer>
          <button onClick={user ? onSignOut : undefined}>
            <UserRound /> {user ? "退出登录" : "游客状态"}
          </button>
          <button onClick={view === "home" ? close : () => setView("home")}>
            {view === "home" ? "返回今日" : "返回空间"} <ChevronRight />
          </button>
        </footer>
      </aside>
    </div>
  );
}

function LoginModal({ close }) {
  const [mode, setMode] = useState("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [submitting, setSubmitting] = useState(false);
  const signInWithGithub = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setMessage("尚未配置 Supabase。请在部署平台添加 Supabase 环境变量。");
      return;
    }
    setSubmitting(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setSubmitting(false);
      setMessage(error.message);
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      setMessage("尚未配置 Supabase。请在部署平台添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。");
      return;
    }
    setSubmitting(true);
    setMessage("");
    let result;
    try {
      result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
    } catch (error) {
      setSubmitting(false);
      setMessage(error.message || "连接 Supabase 失败，请检查网络和项目配置。");
      return;
    }
    setSubmitting(false);
    if (result.error) {
      setMessage(result.error.message.includes("Invalid login credentials")
        ? "邮箱或密码不正确，请检查后重试。"
        : result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("注册成功。请先打开邮箱中的确认链接，再回来登录。\n");
      return;
    }
    window.dispatchEvent(new Event("liva-auth-changed"));
    close();
  };
  return (
    <div className="modal-backdrop login-backdrop" onClick={close}>
      <section className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="关闭">
          <X />
        </button>
        <header>
          <span>
            <Cloud />
          </span>
          <div>
            <h2>{mode === "login" ? "登录小栖" : "创建小栖账号"}</h2>
            <p>把生活数据安全地同步到自己的 Supabase 空间</p>
          </div>
        </header>
        <form onSubmit={submit}>
          <label>
            <span>邮箱</span>
            <div>
              <Mail />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
          </label>
          <label>
            <span>密码</span>
            <div>
              <LockKeyhole />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位"
                minLength={6}
                required
              />
            </div>
          </label>
          <button className="login-submit" type="submit" disabled={submitting}>
            <LogIn />
            {submitting ? "正在连接…" : mode === "login" ? "登录并开始同步" : "注册并开始同步"}
          </button>
        </form>
        <div className="login-divider"><span>或</span></div>
        <button
          className="login-github"
          type="button"
          onClick={signInWithGithub}
          disabled={submitting}
        >
          <Cloud /> 使用 GitHub 登录
        </button>
        {message && (
          <p className="login-status">
            <Cloud />
            {message}
          </p>
        )}
        <div className="login-switch">
          <span>{mode === "login" ? "还没有账号？" : "已经有账号？"}</span>
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
            }}
          >
            {mode === "login" ? "创建账号" : "返回登录"}
          </button>
        </div>
        <small className="login-note">
          当前项目保留了旧版 user_boards
          数据结构；正式连接后，每位用户只会读写自己的数据。
        </small>
      </section>
    </div>
  );
}
function InlineTodoEditor({ task, setTasks, onClose }) {
  const [title, setTitle] = useState(task.title || ""),
    [date, setDate] = useState(
      task.date || new Date().toLocaleDateString("en-CA"),
    ),
    [time, setTime] = useState(
      task.clock || /\d{1,2}:\d{2}/.exec(task.time || "")?.[0] || "",
    ),
    [repeat, setRepeat] = useState(task.repeat || ""),
    [repeatInterval, setRepeatInterval] = useState(task.repeatInterval || 2),
    [repeatUnit, setRepeatUnit] = useState(task.repeatUnit || "day"),
    [repeatMode, setRepeatMode] = useState(task.repeatMode || "interval"),
    [repeatWeekdays, setRepeatWeekdays] = useState(task.repeatWeekdays || []),
    [detailsOpen, setDetailsOpen] = useState(false),
    [note, setNote] = useState(task.note || "");
  const save = () => {
    if (!title.trim()) return;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              title: title.trim(),
              date,
              clock: time,
              time: time ? `${date} ${time}` : date,
              note,
              repeat,
              repeatInterval,
              repeatUnit,
              repeatMode,
              repeatWeekdays,
            }
          : item,
      ),
    );
    onClose();
  };
  return (
    <section
      className="inline-todo-editor"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="inline-todo-primary">
        <label>
          <span>待办内容</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          <span>日期</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          <span>时间（可选）</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <label>
          <span>重复</span>
          <select value={repeat} onChange={(e) => repeatChange(e, setRepeat, setRepeatInterval)}>
            <option value="">不重复</option>
            <option value="daily">每天</option>
            <option value="weekdays">每个工作日</option>
            <option value="weekends">每个周末</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
            <option value="yearly">每年</option>
            <option value="custom">自定义</option>
          </select>
          {repeat === "custom" && (
            <CustomRepeatFields interval={repeatInterval} setInterval={setRepeatInterval} unit={repeatUnit} setUnit={setRepeatUnit} weekdays={repeatWeekdays} setWeekdays={setRepeatWeekdays} mode={repeatMode} setMode={setRepeatMode} />
          )}
        </label>
      </div>
      <button
        className="inline-todo-more"
        onClick={() => setDetailsOpen((v) => !v)}
      >
        <Settings2 />
        <span>{detailsOpen ? "收起设置" : "更多设置"}</span>
        <ChevronDown className={detailsOpen ? "is-open" : ""} />
      </button>
      {detailsOpen && (
        <label className="inline-todo-note">
          <span>备注</span>
          <textarea
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="地点、准备物品、联系方式……"
          />
        </label>
      )}
      <footer>
        <button onClick={onClose}>取消</button>
        <button
          className="inline-todo-save"
          onClick={save}
          disabled={!title.trim()}
        >
          <Check /> 保存待办
        </button>
      </footer>
    </section>
  );
}

function RealmModal({ realm, close, tasks, setTasks, onDataChange }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const Icon = realm.Icon,
    icons = [Video, Footprints, BookOpen, Sparkles],
    statusOptions = ["储备", "点亮", "结束"],
    statusIcons = [Archive, Sparkles, CheckCircle2];
  const [directions, setDirections] = useState(realm.directions),
    [statuses, setStatuses] = useState(() =>
      realm.directions.map(
        (title, i) =>
          matters.find(
            (item) => item.title === title && item.realm === realm.name,
          )?.state ||
          directionStates[i % 4],
      ),
    ),
    [subtitle, setSubtitle] = useState(
      realm.note || "",
    ),
    [adding, setAdding] = useState(false),
    [draft, setDraft] = useState(""),
    [selectedIndex, setSelectedIndex] = useState(null),
    [todoDraft, setTodoDraft] = useState(""),
    [directionNotes, setDirectionNotes] = useState(() =>
      realm.directions.map(
        (d, i) => `${d}承接这一事项里持续发生的内容、经验与具体行动。`,
      ),
    ),
    [editingTitle, setEditingTitle] = useState(null),
    [titleDraft, setTitleDraft] = useState(""),
    [editingTodoId, setEditingTodoId] = useState(null),
    [draggedIndex, setDraggedIndex] = useState(null);
  const realmDirectionSignature = realm.directions.join("\u0001");
  useEffect(() => {
    const nextDirections = [...realm.directions];
    setDirections(nextDirections);
    setStatuses(
      nextDirections.map(
        (title, index) =>
          matters.find(
            (item) => item.title === title && item.realm === realm.name,
          )?.state || directionStates[index % directionStates.length],
      ),
    );
    setDirectionNotes((current) =>
      nextDirections.map(
        (title, index) =>
          matters.find(
            (item) => item.title === title && item.realm === realm.name,
          )?.note ||
          current[directions.indexOf(title)] ||
          `${title}承接这一事项里持续发生的内容、经验与具体行动。`,
      ),
    );
  }, [realmDirectionSignature, realm.name]);
  const add = () => {
    if (draft.trim()) {
      const title = draft.trim();
      realm.directions.push(title);
      setDirections([...realm.directions]);
      setStatuses((v) => [...v, "储备"]);
      matters.push({
        title,
        realm: realm.name,
        state: "储备",
        kind: "长期事项",
        note: "承接日常里正在发生的具体事情",
        Icon: iconForMatterName(title),
        todos: [],
      });
      onDataChange?.();
    }
    setDraft("");
    setAdding(false);
  };
  const saveSubtitle = () => {
    realm.note = subtitle.trim();
    onDataChange?.();
  };
  const cycleStatus = (i) =>
    setStatuses((v) =>
      v.map((status, n) => {
        if (n !== i) return status;
        const next =
            statusOptions[
              (statusOptions.indexOf(status) + 1) % statusOptions.length
            ],
          item = matters.find(
            (entry) =>
              entry.title === directions[i] && entry.realm === realm.name,
          );
        if (item) item.state = next;
        setTasks((current) => current.map((task) => task.tag === directions[i] ? { ...task, archived: false } : task));
        onDataChange?.();
        return next;
      }),
    );
  const archiveDirection = (i) => {
    const item = matters.find((entry) => entry.title === directions[i] && entry.realm === realm.name);
    if (!item) return;
    item.archived = true;
    setTasks((current) => current.map((task) => task.tag === directions[i] ? { ...task, archived: true } : task));
    onDataChange?.();
    setStatuses((current) => [...current]);
  };
  const openDirection = (i) => {
    const itemIndex = matters.findIndex(
      (item) => item.title === directions[i] && item.realm === realm.name,
    );
    if (itemIndex >= 0) window.__boardOpenModal?.(`content-${itemIndex}`);
  };
  const reorderDirection = (from, to) => {
    if (from === null || from === to) return;
    const nextDirections = [...directions],
      nextStatuses = [...statuses],
      nextNotes = [...directionNotes],
      [movedDirection] = nextDirections.splice(from, 1),
      [movedStatus] = nextStatuses.splice(from, 1),
      [movedNote] = nextNotes.splice(from, 1);
    nextDirections.splice(to, 0, movedDirection);
    nextStatuses.splice(to, 0, movedStatus);
    nextNotes.splice(to, 0, movedNote);
    realm.directions.splice(0, realm.directions.length, ...nextDirections);
    setDirections(nextDirections);
    setStatuses(nextStatuses);
    setDirectionNotes(nextNotes);
    setDraggedIndex(null);
    onDataChange?.();
  };
  const selectedTitle = selectedIndex === null ? "" : directions[selectedIndex],
    linkedTasks = tasks.filter((task) => task.tag === selectedTitle),
    activeTasks = linkedTasks.filter((task) => !task.done),
    completedTasks = linkedTasks.filter((task) => task.done);
  const addTodo = () => {
    if (!todoDraft.trim() || selectedIndex === null) return;
    setTasks((v) => [
      ...v,
      {
        id: Date.now(),
        title: todoDraft.trim(),
        tag: selectedTitle,
        time: "未设置时间",
        level: "normal",
      },
    ]);
    setTodoDraft("");
  };
  const beginTitleEdit = (i, source) => {
    setEditingTitle({ index: i, source });
    setTitleDraft(directions[i]);
  };
  const cancelTitleEdit = () => {
    setEditingTitle(null);
    setTitleDraft("");
  };
  const saveTitleEdit = () => {
    if (!editingTitle) return;
    const i = editingTitle.index,
      oldTitle = directions[i],
      nextTitle = titleDraft.trim();
    if (
      !nextTitle ||
      directions.some((title, n) => n !== i && title === nextTitle)
    ) {
      cancelTitleEdit();
      return;
    }
    realm.directions[i] = nextTitle;
    setDirections([...realm.directions]);
    const item = matters.find(
      (entry) => entry.title === oldTitle && entry.realm === realm.name,
    );
    if (item) {
      item.title = nextTitle;
      item.Icon = iconForMatterName(nextTitle);
    }
    setTasks((current) =>
      current.map((task) =>
        task.tag === oldTitle ? { ...task, tag: nextTitle } : task,
      ),
    );
    onDataChange?.();
    cancelTitleEdit();
  };
  const openTodo = (task) => window.__boardOpenModal?.(`todoEdit-${task.id}`);
  const deleteSelectedMatter = () => {
    if (selectedIndex === null) return;
    const itemIndex = matters.findIndex(
      (item) =>
        item.title === directions[selectedIndex] && item.realm === realm.name,
    );
    if (itemIndex < 0) return;
    window.__boardOpenModal?.(`deleteMatter-${itemIndex}`);
  };
  return (
    <div className="modal-backdrop realm-backdrop" onClick={close}>
      <section
        className="realm-modal simple-realm-modal refined-realm-modal"
        data-realm={realm.name}
        style={{ "--c": realm.color, "--t": realm.tint }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="realm-mobile-back" onClick={close} aria-label="返回">
          <ChevronLeft />
        </button>
        <button className="modal-close" onClick={close}>
          <X />
        </button>
        <div className="realm-mobile-menu">
          <button
            className="realm-mobile-menu-trigger"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label="版图更多操作"
            aria-expanded={mobileMenuOpen}
          >
            <MoreHorizontal />
          </button>
          {mobileMenuOpen && (
            <button
              className="realm-mobile-delete"
              onClick={() => {
                setMobileMenuOpen(false);
                window.__boardOpenModal?.(`deleteRealm-${realms.indexOf(realm)}`);
              }}
            >
              <Trash2 /> 删除版图
            </button>
          )}
        </div>
        <button
          className="secondary-delete"
          onClick={() =>
            window.__boardOpenModal?.(`deleteRealm-${realms.indexOf(realm)}`)
          }
        >
          <Trash2 /> 删除版图
        </button>
        <header>
          <span>
            <Icon />
          </span>
          <div className="realm-head-copy">
            <h2>{realm.name}</h2>
            <input
              aria-label="板块副标题"
              value={subtitle}
              onChange={(e) => {
                const next = e.target.value;
                setSubtitle(next);
                realm.note = next;
                onDataChange?.();
              }}
              onBlur={saveSubtitle}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder=""
            />
          </div>
          <div className="header-summary">
            <article>
              <b>{statuses.filter((s, i) => s === "点亮" && !matters.find((m) => m.title === directions[i] && m.realm === realm.name)?.archived).length}</b>
              <span>点亮</span>
            </article>
            <article>
              <b>{statuses.filter((s, i) => s === "储备" && !matters.find((m) => m.title === directions[i] && m.realm === realm.name)?.archived).length}</b>
              <span>储备</span>
            </article>
            <article>
              <b>{statuses.filter((s, i) => s === "结束" && !matters.find((m) => m.title === directions[i] && m.realm === realm.name)?.archived).length}</b>
              <span>结束</span>
            </article>
          </div>
        </header>
        <div className="realm-modal-body">
          <div className="realm-modal-title">
            <div>
              <h3>事项一览</h3>
              <p>长期经营、持续探索，也允许它们自然变化</p>
            </div>
              <button
                onClick={() =>
                  window.__boardOpenModal?.(
                    `addDirection:${encodeURIComponent(realm.name)}`,
                  )
                }
              >
              <Plus /> 新建事项
            </button>
          </div>
          {adding && (
            <div className="add-direction-form">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="输入事项名称"
              />
              <button onClick={add}>添加</button>
              <button onClick={() => setAdding(false)}>取消</button>
            </div>
          )}
          <div className="modal-directions direction-profile-grid show-ended">
            {directions.map((d, i) => {
              const linkedMatter = matters.find((item) => item.title === d && item.realm === realm.name);
              if (linkedMatter?.archived) return null;
              const status = statuses[i] || linkedMatter?.state || "储备",
                statusIndex = Math.max(0, statusOptions.indexOf(status)),
                DIcon = iconForMatterName(d);
              return (
                <article
                  className={`${selectedIndex === i ? "is-expanded" : ""} ${status === "结束" ? "is-ended" : ""}`}
                  draggable={editingTitle?.index !== i}
                  onDragStart={(e) => {
                    setDraggedIndex(i);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(i));
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    reorderDirection(draggedIndex, i);
                  }}
                  onDragEnd={() => setDraggedIndex(null)}
                  onClick={() => openDirection(i)}
                  onKeyDown={(e) => e.key === "Enter" && openDirection(i)}
                  role="button"
                  tabIndex="0"
                  key={`${d}-${i}`}
                >
                  <button
                    className={`direction-profile-state status-${statusIndex}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleStatus(i);
                    }}
                  >
                    <i aria-hidden="true" />
                    <span>{status}</span>
                  </button>
                  <div className="direction-profile-icon">
                    <DIcon />
                  </div>
                  {editingTitle?.index === i &&
                  editingTitle.source === "card" ? (
                    <div
                      className="matter-title-editor card-title-editor"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveTitleEdit();
                          if (e.key === "Escape") cancelTitleEdit();
                        }}
                      />
                      <button onClick={saveTitleEdit} aria-label="保存事项名称">
                        <Check />
                      </button>
                      <button onClick={cancelTitleEdit} aria-label="取消编辑">
                        <X />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="matter-title-trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        beginTitleEdit(i, "card");
                      }}
                    >
                      <h4>{d}</h4>
                    </button>
                  )}
                  <span
                    className="direction-profile-realm"
                    data-mobile-label={realm.name}
                  >
                    {realm.note}
                  </span>
                  <footer>
                    <small>
                      最近更新 · {["今天", "2天前", "5天前", "1周前"][i % 4]}
                    </small>
                  </footer>
                  {status === "结束" && (
                    <button className="direction-archive-action" onClick={(e) => { e.stopPropagation(); archiveDirection(i); }} aria-label={`归档${d}`}>
                      <Archive /> 归档
                    </button>
                  )}
                </article>
              );
            })}
          </div>
          {false && statuses.includes("结束") && (
            <button
              className="ended-items-toggle"
              onClick={() => setShowEnded((v) => !v)}
            >
              <Archive />
              <span>
                {showEnded ? (
                  "收起已结束事项"
                ) : (
                  <>
                    查看已结束事项（
                    {statuses.filter((s) => s === "结束").length}）
                  </>
                )}
              </span>
              <ChevronDown className={showEnded ? "is-open" : ""} />
            </button>
          )}
          {false && showEnded && (
            <section className="ended-items-panel">
              <div className="ended-grid direction-profile-grid">
                {directions.map((d, i) => {
                  if (statuses[i] !== "结束") return null;
                  const DIcon = iconForMatterName(d),
                    StatusIcon = statusIcons[2];
                  return (
                    <article
                      className={selectedIndex === i ? "is-expanded" : ""}
                      onClick={() => openDirection(i)}
                      onKeyDown={(e) => e.key === "Enter" && openDirection(i)}
                      role="button"
                      tabIndex="0"
                      key={`ended-${d}-${i}`}
                    >
                      <button
                        className="direction-profile-state status-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleStatus(i);
                        }}
                      >
                        <StatusIcon aria-hidden="true" />
                        {statuses[i]}
                      </button>
                      <div className="direction-profile-icon">
                        <DIcon />
                      </div>
                      {editingTitle?.index === i &&
                      editingTitle.source === "card" ? (
                        <div
                          className="matter-title-editor card-title-editor"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            autoFocus
                            value={titleDraft}
                            onChange={(e) => setTitleDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveTitleEdit();
                              if (e.key === "Escape") cancelTitleEdit();
                            }}
                          />
                          <button
                            onClick={saveTitleEdit}
                            aria-label="保存事项名称"
                          >
                            <Check />
                          </button>
                          <button
                            onClick={cancelTitleEdit}
                            aria-label="取消编辑"
                          >
                            <X />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="matter-title-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            beginTitleEdit(i, "card");
                          }}
                        >
                          <h4>{d}</h4>
                        </button>
                      )}
                      <span>{realm.note}</span>
                      <footer>
                        <small>
                          最近更新 ·{" "}
                          {["今天", "2天前", "5天前", "1周前"][i % 4]}
                        </small>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          {selectedIndex !== null && (
            <section className="direction-inline-manager">
              <header>
                <div className="manager-title">
                  <span>
                    {React.createElement(icons[selectedIndex % icons.length])}
                  </span>
                  <div>
                    <small>{realm.name} · 事项内容</small>
                    {editingTitle?.index === selectedIndex &&
                    editingTitle.source === "manager" ? (
                      <div className="matter-title-editor manager-title-editor">
                        <input
                          autoFocus
                          value={titleDraft}
                          onChange={(e) => setTitleDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveTitleEdit();
                            if (e.key === "Escape") cancelTitleEdit();
                          }}
                        />
                        <button
                          onClick={saveTitleEdit}
                          aria-label="保存事项名称"
                        >
                          <Check />
                        </button>
                        <button onClick={cancelTitleEdit} aria-label="取消编辑">
                          <X />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="matter-title-trigger manager-title-trigger"
                        onClick={() => beginTitleEdit(selectedIndex, "manager")}
                      >
                        <h3>{selectedTitle}</h3>
                      </button>
                    )}
                  </div>
                </div>
                <div className="manager-actions">
                  <div className="manager-counts">
                    <span>
                      <b>{activeTasks.length}</b> 正在发生
                    </span>
                    <span>
                      <b>{completedTasks.length}</b> 最近完成
                    </span>
                  </div>
                  <button
                    className="inline-matter-delete"
                    onClick={deleteSelectedMatter}
                  >
                    <Trash2 /> 删除事项
                  </button>
                </div>
              </header>
              <div className="manager-note">
                <label>事项说明</label>
                <textarea
                  value={directionNotes[selectedIndex]}
                  onChange={(e) =>
                    setDirectionNotes((v) =>
                      v.map((note, i) =>
                        i === selectedIndex ? e.target.value : note,
                      ),
                    )
                  }
                />
              </div>
              <div className="manager-columns">
                <section>
                  <div className="manager-heading">
                    <div>
                      <h4>具体内容</h4>
                      <p>这里的每一项都可以继续落到每日待办</p>
                    </div>
                  </div>
                  <div className="inline-task-list">
                    {activeTasks.map((task) => (
                      <React.Fragment key={task.id}>
                        <article
                          role="button"
                          tabIndex="0"
                          onClick={() => openTodo(task)}
                          onKeyDown={(e) => e.key === "Enter" && openTodo(task)}
                        >
                          <span>
                            <ListChecks />
                          </span>
                          <div>
                            <b>{task.title}</b>
                            <small>{task.time}</small>
                          </div>
                        </article>
                        {editingTodoId === task.id && (
                          <InlineTodoEditor
                            task={task}
                            setTasks={setTasks}
                            onClose={() => setEditingTodoId(null)}
                          />
                        )}
                      </React.Fragment>
                    ))}
                    {!activeTasks.length && (
                      <p className="inline-empty">
                        还没有具体内容，可以从一件小事开始。
                      </p>
                    )}
                  </div>
                  <div className="inline-add">
                    <input
                      value={todoDraft}
                      onChange={(e) => setTodoDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTodo()}
                      placeholder="添加一项具体内容或待办…"
                    />
                    <button onClick={addTodo}>
                      <Plus /> 添加
                    </button>
                  </div>
                </section>
                <aside>
                  <div className="manager-heading">
                    <div>
                      <h4>近期完成</h4>
                      <p>保留已经发生过的生活痕迹</p>
                    </div>
                  </div>
                  <div className="inline-completed">
                    {completedTasks.slice(0, 4).map((task) => (
                      <React.Fragment key={task.id}>
                        <article
                          role="button"
                          tabIndex="0"
                          onClick={() => openTodo(task)}
                          onKeyDown={(e) => e.key === "Enter" && openTodo(task)}
                        >
                          <CheckCircle2 />
                          <div>
                            <b>{task.title}</b>
                            <small>{task.time}</small>
                          </div>
                        </article>
                        {editingTodoId === task.id && (
                          <InlineTodoEditor
                            task={task}
                            setTasks={setTasks}
                            onClose={() => setEditingTodoId(null)}
                          />
                        )}
                      </React.Fragment>
                    ))}
                    {!completedTasks.length && (
                      <p className="inline-empty">完成后的内容会留在这里。</p>
                    )}
                  </div>
                </aside>
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

function QuickTodoModal({ close, setTasks, initialTag = "" }) {
  const defaultTodoTheme = realms[3] || { color: "#91aace", tint: "#fafbfd" };
  const [title, setTitle] = useState(""),
    [tag, setTag] = useState(initialTag || "临时待办事项"),
    [selectedRealmName, setSelectedRealmName] = useState(() =>
      initialTag
        ? realms.find((r) => r.directions.includes(initialTag))?.name || ""
        : realms[3]?.name || "",
    ),
    [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA")),
    [time, setTime] = useState(""),
    [repeat, setRepeat] = useState(""),
    [repeatInterval, setRepeatInterval] = useState(2),
    [repeatUnit, setRepeatUnit] = useState("day"),
    [repeatMode, setRepeatMode] = useState("interval"),
    [repeatWeekdays, setRepeatWeekdays] = useState([]),
    [note, setNote] = useState(""),
    [subtasks, setSubtasks] = useState([]),
    [subtaskDraft, setSubtaskDraft] = useState(""),
    [detailsOpen, setDetailsOpen] = useState(false),
    isMobile = window.matchMedia?.("(max-width: 800px)").matches;
  const realm = realms.find((r) => r.name === selectedRealmName) || defaultTodoTheme,
    availableItems = selectedRealmName
      ? matters.filter(
          (item) => item.realm === selectedRealmName && item.state === "点亮",
        )
      : [],
    addSubtask = () => {
      if (!subtaskDraft.trim() || subtasks.length >= 5) return;
      setSubtasks((v) => [...v, subtaskDraft.trim()]);
      setSubtaskDraft("");
    },
    save = () => {
      if (!title.trim()) return;
      const taskTime = time ? `${date} ${time}` : date;
      setTasks((v) => [
        ...v,
        {
          id: Date.now(),
          title: title.trim(),
          tag: tag || (selectedRealmName === "Admin" ? "临时待办事项" : "收集箱"),
          realm: selectedRealmName || undefined,
          time: taskTime,
          level: "normal",
          date,
          clock: time,
          repeat,
          repeatInterval,
          repeatUnit,
          repeatMode,
          repeatWeekdays,
          duration: "未设置",
          durationHours: 1,
          note,
          subtasks: subtasks.filter(Boolean),
          done: false,
        },
      ]);
      close();
    };
  return (
    <div className="modal-backdrop quick-todo-backdrop" onClick={close}>
      <section
        className={`quick-todo-modal refined-quick-todo unified-todo-create ${isMobile ? "unified-todo-edit" : ""}`}
        data-realm={realm.name}
        style={{ "--c": realm.color, "--t": realm.tint }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={close} aria-label="关闭">
          <X />
        </button>
        <header>
          <span>
            <ListChecks />
          </span>
          <div>
            <h2>新建待办</h2>
            <p>把一件具体的事，轻轻放进今天</p>
          </div>
        </header>
        <label className="quick-title">
          <span>待办内容</span>
          {isMobile ? (
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="准备做什么？" />
          ) : (
            <textarea autoFocus rows="3" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="准备做什么？" />
          )}
        </label>
        <div className="quick-mobile-actions" aria-label="待办快捷设置">
          <button onClick={() => setDetailsOpen(true)}>
            <CalendarDays /> 今天
          </button>
          <button onClick={() => setDetailsOpen(true)}>
            <Clock3 /> 时间
          </button>
          <button onClick={() => setDetailsOpen(true)}>
            <RefreshCw /> 重复
          </button>
          <button onClick={() => setDetailsOpen((v) => !v)}>
            <MoreHorizontal /> 更多
          </button>
        </div>
        <button
          className="quick-details-toggle quick-details-master-toggle"
          onClick={() => setDetailsOpen((v) => !v)}
          aria-expanded={detailsOpen}
        >
          <Settings2 />
          <span>{detailsOpen ? "收起设置" : "更多设置"}</span>
          <ChevronDown />
        </button>
        <section
          className={`quick-form-section ${detailsOpen || isMobile ? "" : "quick-collapsed-details"}`}
        >
          <div className="quick-section-title">
            <span>详细信息</span>
          </div>
          <div className="quick-link-fields">
            <label>
              <span>
                <Compass /> 所属版图（可选）
              </span>
              <select
                value={selectedRealmName}
                onChange={(e) => {
                  const next = e.target.value,
                    first = matters.find(
                      (item) => item.realm === next && item.state === "点亮",
                    );
                  setSelectedRealmName(next);
                  setTag(first?.title || "");
                }}
              >
                <option value="">不关联版图</option>
                {realms.map((r) => (
                  <option value={r.name} key={r.name}>
                    {r.name} · {getRealmNote(r)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>
                <BookOpen /> 所属事项（可选）
              </span>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                disabled={!selectedRealmName}
              >
                <option value="">
                  {selectedRealmName ? "不关联事项" : "请先选择版图"}
                </option>
                {availableItems.map((item) => (
                  <option value={item.title} key={item.title}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="quick-time-fields">
            <label>
              <span>
                <CalendarDays /> 日期
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              <span>
                <Clock3 /> 时间（可选）
              </span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>
            <label>
              <span>重复</span>
              <select value={repeat} onChange={(e) => repeatChange(e, setRepeat, setRepeatInterval)}>
                <option value="">不重复</option>
                <option value="daily">每天</option>
                <option value="weekdays">每个工作日</option>
                <option value="weekends">每个周末</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
                <option value="yearly">每年</option>
                <option value="custom">自定义</option>
              </select>
              {repeat === "custom" && (
                <CustomRepeatFields interval={repeatInterval} setInterval={setRepeatInterval} unit={repeatUnit} setUnit={setRepeatUnit} weekdays={repeatWeekdays} setWeekdays={setRepeatWeekdays} mode={repeatMode} setMode={setRepeatMode} />
              )}
            </label>
          </div>
        </section>
        <section className="quick-form-section quick-details-section">
          <button
            className="quick-details-toggle internal-toggle"
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
          >
            <Settings2 />
            <span>{detailsOpen ? "收起设置" : "更多设置"}</span>
            <ChevronDown />
          </button>
          {detailsOpen && (
            <div className="quick-details-body">
              <label className="quick-note">
                <span>备注</span>
                <div>
                  <textarea
                    maxLength={200}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="地点、准备物品、联系方式……"
                  />
                  <small>{note.length}/200</small>
                </div>
              </label>
              <div className="quick-subtasks">
                <div className="quick-subtask-head">
                  <span>子任务</span>
                  <small>{subtasks.length}/5</small>
                </div>
                {subtasks.length > 0 && (
                  <div className="quick-subtask-list">
                    {subtasks.map((item, i) => (
                      <label key={i}>
                        <button
                          className="subtask-circle"
                          aria-label="标记子任务"
                        >
                          <Check />
                        </button>
                        <input
                          autoFocus={!item}
                          value={item}
                          onChange={(e) =>
                            setSubtasks((v) =>
                              v.map((x, n) => (n === i ? e.target.value : x)),
                            )
                          }
                          placeholder="输入子任务"
                        />
                        <button
                          onClick={() =>
                            setSubtasks((v) => v.filter((_, n) => n !== i))
                          }
                          aria-label="删除子任务"
                        >
                          <X />
                        </button>
                      </label>
                    ))}
                  </div>
                )}
                <div className="quick-subtask-add">
                  <input
                    value={subtaskDraft}
                    onChange={(e) => setSubtaskDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    placeholder="快速添加一个子任务…"
                  />
                  <button
                    onClick={addSubtask}
                    disabled={!subtaskDraft.trim() || subtasks.length >= 5}
                  >
                    <Plus /> 添加
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
        {isMobile ? (
          <footer className="unified-todo-footer create-todo-footer">
            <span />
            <div>
              <button type="button" onClick={close}>取消</button>
              <button className="quick-save" disabled={!title.trim()} onClick={save}>
                <Check /> 保存待办
              </button>
            </div>
          </footer>
        ) : (
          <button className="quick-save" disabled={!title.trim()} onClick={save}>
            <Check /> 保存待办
          </button>
        )}
      </section>
    </div>
  );
}

function InspirationMemo({ close, setTasks, onDataChange }) {
  const [draft, setDraft] = useState(""),
    [memos, setMemos] = useState(() => [...inspirationMemos]),
    [converting, setConverting] = useState([]),
    [draggedMemoId, setDraggedMemoId] = useState(null);
  const commit = (updater) =>
    setMemos((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      persistInspirationMemos(next);
      onDataChange?.();
      return next;
    });
  const add = () => {
    if (!draft.trim()) return;
    commit((v) => [
      {
        id: Date.now(),
        text: draft.trim(),
        time: "刚刚",
        done: false,
        converted: false,
      },
      ...v,
    ]);
    setDraft("");
  };
  const update = (id, patch) =>
    commit((v) => v.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const moveMemo = (source, target) => commit((current) => {
    const next = [...current], from = next.findIndex((memo) => String(memo.id) === String(source)), to = next.findIndex((memo) => String(memo.id) === String(target));
    if (from < 0 || to < 0 || from === to) return current;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  });
  const bindMemoTouch = useTouchReorder(moveMemo);
  const convert = (memo) => {
    if (converting.includes(memo.id)) return;
    setConverting((current) => [...current, memo.id]);
    window.setTimeout(() => {
      setTasks((current) => [
        {
          id: Date.now(),
          title: memo.text,
          tag: "收集箱",
          time: "即时待办",
          level: "normal",
          date: "",
          clock: "",
          note: "由灵感备忘转入",
          subtasks: [],
          done: false,
          instant: true,
        },
        ...current,
      ]);
      commit((current) => current.filter((item) => item.id !== memo.id));
      setConverting((current) => current.filter((id) => id !== memo.id));
    }, 360);
  };
  return (
    <div className="modal-backdrop inspiration-backdrop" onClick={close}>
      <section
        className="inspiration-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={close} aria-label="关闭">
          <X />
        </button>
        <header>
          <span>
            <NotebookPen />
          </span>
          <div>
            <h2>灵感备忘</h2>
            <p>想到什么就先放在这里，不必分类。</p>
          </div>
        </header>
        <div className="inspiration-capture">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") add();
            }}
            placeholder="写下一闪而过的念头…"
          />
          <button disabled={!draft.trim()} onClick={add}>
            <Plus /> 记下来
          </button>
          <small>Ctrl + Enter 快速保存</small>
        </div>
        <div className="inspiration-list-head">
          <span>全部灵感</span>
          <b>{memos.length}</b>
        </div>
        <div className="inspiration-list">
          {memos.map((memo) => (
            <article
              className={`${converting.includes(memo.id) ? "is-converting " : ""}${memo.done ? "done" : ""}`}
              data-touch-order={memo.id}
              draggable
              onDragStart={(event) => {
                setDraggedMemoId(memo.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(memo.id));
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const source = draggedMemoId ?? event.dataTransfer.getData("text/plain");
                if (source) moveMemo(source, memo.id);
                setDraggedMemoId(null);
              }}
              onDragEnd={() => setDraggedMemoId(null)}
              key={memo.id}
            >
              <button className="memo-drag-handle" aria-label={`调整${memo.text}顺序`} {...bindMemoTouch(memo.id)}><GripVertical /></button>
              <button
                className="memo-check"
                onClick={() => update(memo.id, { done: !memo.done })}
                aria-label={memo.done ? "恢复" : "标记已整理"}
              >
                {memo.done ? <Check /> : null}
              </button>
              <div>
                <p>{memo.text}</p>
                <small>
                  {memo.time}
                  {memo.converted ? " · 已转为即时待办" : ""}
                </small>
              </div>
              <div className="memo-actions">
                <button
                  className={memo.converted ? "active" : ""}
                  onClick={() => convert(memo)}
                  disabled={converting.includes(memo.id)}
                  title={memo.converted ? "已转为即时待办" : "转为即时待办"}
                  aria-label={
                    memo.converted ? "已转为即时待办" : "转为即时待办"
                  }
                >
                  <ListChecks />
                </button>
                <button
                  onClick={() =>
                    commit((v) => v.filter((m) => m.id !== memo.id))
                  }
                  title="删除"
                  aria-label="删除"
                >
                  <Trash2 />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Modal({ type, close, navigate, tasks, setTasks, onDataChange }) {
  if (!type) return null;
  if (type === "note")
    return (
      <InspirationMemo
        close={close}
        setTasks={setTasks}
        onDataChange={onDataChange}
      />
    );
  if (type === "addTodo" || type.startsWith("addTodo:"))
    return (
      <QuickTodoModal
        close={close}
        setTasks={setTasks}
        initialTag={
          type.includes(":")
            ? decodeURIComponent(type.slice(type.indexOf(":") + 1))
            : ""
        }
      />
    );
  if (type.startsWith("realmModal-"))
    return (
      <RealmModal
        realm={realms[Number(type.split("-")[1])]}
        close={close}
        tasks={tasks}
        setTasks={setTasks}
        onDataChange={onDataChange}
      />
    );
  const map = {
    search: ["搜索", "搜索事项、事项、记录或待办…"],
    notice: ["通知", "没有需要立即处理的通知。"],
    sync: ["登录并同步", "登录后可在不同设备间同步生活数据。"],
    settings: ["偏好设置", "调整显示、提醒与数据选项。"],
    help: [
      "使用帮助",
      "版图用来理解生活，事项用来记录开展，待办只承接具体提醒。",
    ],
    addRoutine: ["添加日常照顾", "写下想经常回来的事情，不设置连续天数。"],
    addMatter: ["新增事项", "选择所属事项，记录它现在的状态。"],
    matterDetail: ["事项内容", "在这里整理相关记录、资料与最近状态。"],
    profile: ["编辑个人资料", "修改称呼、头像与个人说明。"],
  };
  if (type === "gotoTodo") {
    navigate("todo");
    close();
    return null;
  }
  const [title, desc] = map[type] || ["功能", "该功能正在这里展开。"];
  const add = () => close();
  return (
    <div className="modal-backdrop" onClick={close}>
      <section className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close}>
          <X />
        </button>
        <span className="modal-icon">
          {type === "search" ? <Search /> : <Sparkles />}
        </span>
        <h2>{title}</h2>
        <p>{desc}</p>
        {["search", "addRoutine", "addMatter", "profile"].includes(type) && (
          <input
            autoFocus
            placeholder={type === "search" ? "输入关键词…" : "在这里写下内容…"}
          />
        )}
        <button className="modal-primary" onClick={add}>
          {type === "search" ? "搜索" : "保存"}
        </button>
      </section>
    </div>
  );
}
function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseAssistantTask(input) {
  let title = input.trim();
  const result = {
    type: "create",
    title: "",
    tag: "临时待办事项",
    realm: "Admin",
    date: localDateKey(),
    time: "今天",
    repeat: "",
    scheduleLabel: "今天",
  };
  title = title
    .replace(/^(?:微光[，,\s]*)?(?:麻烦)?(?:请)?(?:你)?(?:帮我|替我|给我)?(?:增加|新增|添加|创建|记下|安排|设置|设定)(?:一下)?(?:一(?:个|条|项))?[，,：:\s]*/i, "")
    .replace(/[，,。.!！?？\s]*(?:的)?(?:待办|事项|任务|提醒)[。.!！?？\s]*$/i, "")
    .trim();

  const clock = title.match(/(?:上午|早上|下午|晚上|今晚)?\s*(\d{1,2})(?:点|时)(半|\d{1,2}分?)?/);
  if (clock) {
    let hour = Number(clock[1]);
    if (/(下午|晚上|今晚)/.test(clock[0]) && hour < 12) hour += 12;
    const minute = clock[2] === "半" ? 30 : Number(String(clock[2] || "0").replace("分", ""));
    const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    result.time = value;
    title = title.replace(clock[0], "").trim();
  }

  const repeatRules = [
    [/(每个工作日|工作日每天)/, "weekdays", "每个工作日"],
    [/(每天|每日|天天|每早|每天早上|每晚|每天晚上)/, "daily", "每天"],
    [/(每周|每星期)/, "weekly", "每周"],
    [/(每月)/, "monthly", "每月"],
    [/(每年)/, "yearly", "每年"],
  ];
  const repeatRule = repeatRules.find(([pattern]) => pattern.test(title));
  if (repeatRule) {
    result.repeat = repeatRule[1];
    result.scheduleLabel = `${repeatRule[2]}${result.time !== "今天" ? ` · ${result.time}` : ""}`;
    result.time = result.time === "今天" ? repeatRule[2] : result.time;
    title = title.replace(repeatRule[0], "").trim();
  } else if (/明天/.test(title)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    result.date = localDateKey(tomorrow);
    result.scheduleLabel = result.time === "今天" ? "明天" : `明天 · ${result.time}`;
    if (result.time === "今天") result.time = "明天";
    title = title.replace(/明天/, "").trim();
  } else {
    const weekday = title.match(/(?:这|本|下)?周([一二三四五六日天])/);
    if (weekday) {
      const index = "日一二三四五六".indexOf(weekday[1] === "天" ? "日" : weekday[1]);
      const target = new Date();
      let offset = (index - target.getDay() + 7) % 7;
      if (/下周/.test(weekday[0])) offset += offset === 0 ? 7 : 7;
      target.setDate(target.getDate() + offset);
      result.date = localDateKey(target);
      result.scheduleLabel = `${weekday[0]}${result.time !== "今天" ? ` · ${result.time}` : ""}`;
      if (result.time === "今天") result.time = weekday[0];
      title = title.replace(weekday[0], "").trim();
    } else if (result.time !== "今天") {
      result.scheduleLabel = `今天 · ${result.time}`;
    }
  }

  result.title = title
    .replace(/^(?:要|去|做|开始|坚持)\s*/, "")
    .replace(/[，,。.!！?？\s]*(?:的)?(?:待办|事项|任务|提醒)[。.!！?？\s]*$/i, "")
    .trim() || "新的生活事项";
  return result;
}

function migrateAssistantPersonaText(text = "") {
  return String(text)
    .replaceAll("栗子", "微光")
    .replaceAll("今日待办汇报来了喵", "今日星光简报来了")
    .replaceAll("喵", "")
    .replaceAll("用爪子按住", "先替你标记")
    .replaceAll("动爪", "调整星轨")
    .replaceAll("叼进待办", "放进生活星轨")
    .replaceAll("巡视", "照亮");
}

function AssistantMessageBody({ text, report = false }) {
  if (!report) return <div className="assistant-bubble">{text}</div>;
  const rows = String(text || "").split("\n").filter((line, index, all) => line.trim() || (index > 0 && all[index - 1].trim()));
  return (
    <div className="assistant-bubble assistant-report-body">
      {rows.map((line, index) => {
        const value = line.trim();
        if (/^\*\*.+\*\*$/.test(value)) return <h4 key={index}>{value.replace(/^\*\*|\*\*$/g, "")}</h4>;
        if (/^-\s*/.test(value)) return <div className="assistant-report-row" key={index}><i /><span>{value.replace(/^-\s*/, "")}</span></div>;
        if (!value) return <span className="assistant-report-space" key={index} />;
        return <p key={index}>{value.replace(/\*\*/g, "")}</p>;
      })}
    </div>
  );
}

function AssistantPage({ tasks, setTasks, navigate, openModal, onAssistantReply }) {
  const { profile } = useLivaProfile();
  const hour = new Date().getHours();
  const dayGreeting = hour < 6 ? "还没睡呀" : hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [assistantMemory, setAssistantMemory] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("liva-assistant-memory"));
      return Array.isArray(saved) ? saved.slice(-30) : [];
    } catch { return []; }
  });
  const streamRef = useRef(null);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("liva-assistant-messages"));
      if (Array.isArray(saved) && saved.length)
        return saved.map((message) => message.role === "assistant" ? { ...message, text: migrateAssistantPersonaText(message.text) } : message);
    } catch {}
    return [{
      role: "assistant",
      text: `${dayGreeting}，${profile.name}。我是微光，刚刚替你照了一遍今天的生活版图。想先点亮最重要的一件事，还是听听今日简报？`,
    }];
  });
  const [pending, setPending] = useState(() => {
    try { return JSON.parse(localStorage.getItem("liva-assistant-pending")); } catch { return null; }
  });
  const todayDateKey = localDateKey();
  const activeTasks = tasks.filter((task) => !task.archived && taskOccursOnDate(task, todayDateKey) && !taskCompletedOnDate(task, todayDateKey));
  const lateTasks = activeTasks.filter((task) => taskIsOverdueOnDate(task, todayDateKey));
  const completedTasks = tasks.filter((task) => !task.archived && taskCompletedOnDate(task, todayDateKey));
  const nextTimedTask = activeTasks
    .filter((task) => /\d{1,2}:\d{2}/.test(`${task.clock || ""} ${task.time || ""}`))
    .sort((a, b) => `${a.clock || a.time}`.localeCompare(`${b.clock || b.time}`, "zh-CN"))[0];
  const [broadcastEnabled, setBroadcastEnabled] = useState(() => localStorage.getItem("liva-evening-broadcast") !== "off");
  useEffect(() => localStorage.setItem("liva-evening-broadcast", broadcastEnabled ? "on" : "off"), [broadcastEnabled]);
  useEffect(() => {
    const stream = streamRef.current;
    if (stream) stream.scrollTop = stream.scrollHeight;
  }, [messages, pending, isThinking]);
  const buildDailyBroadcast = () => {
    const isWorkTask = (task) => {
      const realm = realmForTask(task);
      return realm.name === "Fortune" || /工作|合同|采购|项目|会议|材料|资金/.test(`${task.tag || ""}${task.title}`);
    };
    const workTasks = activeTasks.filter(isWorkTask);
    const completedWorkTasks = completedTasks.filter(isWorkTask);
    const habitTasks = activeTasks.filter((task) => task.repeat && !workTasks.includes(task));
    const otherTasks = activeTasks.filter((task) => !workTasks.includes(task) && !habitTasks.includes(task));
    const activeMemos = inspirationMemos.filter((memo) => !memo.done);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = localDateKey(tomorrow);
    const tomorrowTasks = tasks.filter((task) => !task.archived && task.date && taskOccursOnDate(task, tomorrowKey) && !taskCompletedOnDate(task, tomorrowKey));
    const formatItems = (items, prefix = "•") => items.length
      ? items.map((item, index) => `${prefix === "letter" ? `${String.fromCharCode(65 + index)}.` : prefix} ${item.title}${item.time ? `（${item.time}）` : ""}`).join("\n")
      : "暂时没有";
    const sections = [
      "今日星光简报来了。微光已经替你按轻重梳理好了。",
      `💼 今日工作安排（${completedWorkTasks.length}/${workTasks.length + completedWorkTasks.length}）\n${formatItems(workTasks)}`,
    ];
    if (habitTasks.length) sections.push(`🌱 今日习惯\n${formatItems(habitTasks, "letter")}`);
    if (otherTasks.length) sections.push(`📌 今日其他待办\n${formatItems(otherTasks)}`);
    if (activeMemos.length) sections.push(`📝 灵感清单（随时待办，${activeMemos.length}项）\n${activeMemos.map((memo, index) => `${String.fromCharCode(97 + index)}. ${memo.text}`).join("\n")}`);
    sections.push(`✅ 今日已完成（${completedTasks.length}项）\n${formatItems(completedTasks, "✅")}`);
    sections.push(`📅 明天日程（${tomorrow.getMonth() + 1}/${tomorrow.getDate()}）\n${formatItems(tomorrowTasks, "⏰")}`);
    const priority = workTasks.length
      ? `今天工作里的 ${workTasks.length} 项是主线。先点亮最重要的一件，微光会替你守住其余节奏。`
      : habitTasks.length
        ? "今天没有紧急工作，稳稳完成习惯就很好。微光陪你一步一步来。"
        : "今天的安排不拥挤，挑一件最想推进的先开始吧。微光会一直亮着。";
    return `${sections.join("\n\n")}\n\n${priority}`;
  };
  useEffect(() => {
    localStorage.setItem("liva-assistant-messages", JSON.stringify(messages.slice(-100)));
  }, [messages]);
  useEffect(() => {
    if (pending) localStorage.setItem("liva-assistant-pending", JSON.stringify(pending));
    else localStorage.removeItem("liva-assistant-pending");
  }, [pending]);

  const respond = async (rawText) => {
    const text = rawText.trim();
    if (!text || isThinking || isSending) return;
    const history = messages;
    const clientId = `user-${Date.now()}`;
    setMessages((value) => [...value, { role: "user", text, clientId, delivery: "sending" }]);
    setDraft("");
    setIsSending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 260));
    setMessages((value) => value.map((message) => message.clientId === clientId ? { ...message, delivery: "delivered" } : message));
    await new Promise((resolve) => window.setTimeout(resolve, 320));
    setIsSending(false);
    setIsThinking(true);
    try {
      const [response] = await Promise.all([fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          context: {
            profile: { name: profile.name },
            tasks: tasks.filter((task) => !task.archived).map(({ id, title, tag, realm, date, time, repeat, repeatMode, repeatWeekdays, completedDates, done, level }) => ({ id, title, tag, realm, date, time, repeat, repeatMode, repeatWeekdays, completedDates: completedDates || [], done: Boolean(done), level })),
            realms: realms.map((realm) => ({ name: realm.name, note: getRealmNote(realm), directions: realm.directions })),
            matters: matters.filter((matter) => !matter.archived).map(({ title, realm, state, kind, note }) => ({ title, realm, state, kind, note })),
            inspirationMemos: inspirationMemos.map(({ text: memoText, time, done }) => ({ text: memoText, time, done })),
            assistantMemory,
          },
        }),
      }), new Promise((resolve) => window.setTimeout(resolve, 680))]);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI 服务暂时不可用");
      if (Array.isArray(result.memoryUpdates) && result.memoryUpdates.length) {
        setAssistantMemory((current) => {
          const next = [...current];
          result.memoryUpdates.forEach((memory) => {
            const normalized = String(memory || "").trim();
            if (normalized && !next.includes(normalized)) next.push(normalized);
          });
          const trimmed = next.slice(-30);
          localStorage.setItem("liva-assistant-memory", JSON.stringify(trimmed));
          return trimmed;
        });
      }
      const actions = Array.isArray(result.actions)
        ? result.actions.filter(Boolean)
        : result.action ? [result.action] : [];
      if (actions.length) setPending(actions.length === 1 ? actions[0] : { type: "batch", actions });
      setMessages((value) => [...value, {
        role: "assistant",
        kind: result.reply.includes("\n") ? "report" : undefined,
        text: result.reply,
        arriving: true,
      }]);
      window.setTimeout(() => setMessages((value) => value.map((message) => message.arriving ? { ...message, arriving: false } : message)), 620);
      onAssistantReply?.();
    } catch (error) {
      setMessages((value) => [...value, { role: "assistant", kind: "error", text: error.message, arriving: true }]);
      onAssistantReply?.();
    } finally {
      setIsThinking(false);
    }
  };

  const confirmCreate = () => {
    if (!pending) return;
    const actions = pending.type === "batch" ? pending.actions : [pending];
    setTasks((value) => actions.reduce((current, rawAction, index) => {
      const action = { ...rawAction, type: rawAction.type === "create" ? "create_task" : rawAction.type },
        normalizedStatus = action.status === "未开始" || action.status === "待安排" ? "待安排" : "进行中";
      if (action.type === "create_task") {
        const linkedMatter = matters.find((matter) => matter.title === action.tag);
        return [...current, {
          id: Date.now() + index,
          title: action.title,
          tag: action.tag || "临时待办事项",
          realm: linkedMatter?.realm || "Admin",
          date: action.date || localDateKey(),
          time: action.time || "随时待办",
          clock: /^\d{1,2}:\d{2}$/.test(action.time || "") ? action.time : "",
          repeat: action.repeat || undefined,
          matterStatus: normalizedStatus,
          level: "normal",
          done: false,
        }];
      }
      if (action.type === "update_task") return current.map((task) => task.id === action.taskId ? {
        ...task,
        ...(action.title ? { title: action.title } : {}),
        ...(action.date ? { date: action.date } : {}),
        ...(action.time ? { time: action.time } : {}),
        ...(action.time && /^\d{1,2}:\d{2}$/.test(action.time) ? { clock: action.time } : {}),
        ...(action.repeat ? { repeat: action.repeat } : {}),
        ...(action.tag ? { tag: action.tag } : {}),
        ...(action.status ? { matterStatus: normalizedStatus } : {}),
      } : task);
      if (action.type === "complete_task") return current.map((task) => task.id === action.taskId ? { ...task, done: true } : task);
      if (action.type === "delete_task") return current.filter((task) => task.id !== action.taskId);
      return current;
    }, value));
    const actionLabel = actions.length > 1 ? `批量处理 ${actions.length} 条待办` : ({ create_task: "添加", update_task: "更新", complete_task: "完成", delete_task: "删除" }[actions[0]?.type] || "处理");
    const targetTitle = actions.length > 1 ? "" : actions[0]?.title || tasks.find((task) => task.id === actions[0]?.taskId)?.title || "这件事项";
    setMessages((value) => [...value, {
      role: "assistant",
      text: actions.length > 1 ? `完成，已经${actionLabel}。每一条的状态也按你的要求保存好了。` : `完成，已经${actionLabel}「${targetTitle}」。微光会继续替你留意。`,
      arriving: true,
    }]);
    setPending(null);
  };

  const suggestions = [
    ["今天有什么要紧的？", "帮我总结今天的进展"],
    ["检查逾期事项", "有哪些逾期事项？"],
    ["微光能做什么？", "介绍一下你能帮我做什么，以及会播报哪些内容"],
  ];
  return (
    <div className="assistant-page">
      <header className="assistant-header">
        <button className="assistant-mobile-back" onClick={() => navigate("today")} aria-label="返回首页"><ChevronLeft /></button>
        <div className="assistant-mark"><Sparkles /></div>
        <div><h1>微光</h1><p><i /> Liva 里的生活星光 · 正为你亮着</p></div>
        <button className="assistant-history" onClick={() => openModal("notice")} aria-label="查看播报"><Bell /></button>
      </header>
      <div className="assistant-layout">
        <section className="assistant-conversation">
          <div className="assistant-stream" aria-live="polite" ref={streamRef}>
            <div className="assistant-day"><span>今天</span></div>
            {messages.map((message, index) => (
              <div className={`assistant-message ${message.role} ${message.kind || ""} ${message.arriving ? "is-arriving" : ""} ${message.delivery === "sending" ? "is-sending" : ""}`} key={message.clientId || `${message.role}-${index}`}>
                {message.role === "assistant" && <span><Sparkles /></span>}
                <div className="assistant-message-stack">
                  {message.role === "assistant" && <small className="assistant-message-author">微光</small>}
                  <AssistantMessageBody text={message.text} report={message.kind === "report"} />
                  {message.role === "user" && message.delivery && <small className="assistant-delivery">{message.delivery === "sending" ? "发送中" : "已送达"}</small>}
                </div>
              </div>
            ))}
            {isThinking && <div className="assistant-message assistant thinking"><span><Sparkles /></span><div className="assistant-message-stack"><small className="assistant-message-author">微光</small><div className="assistant-bubble">微光正在梳理你的想法…</div></div></div>}
            {pending && (
              <article className="assistant-action-preview">
                <header><ListChecks /><div><b>{pending.type === "batch" ? `微光准备处理 ${pending.actions.length} 条待办` : "微光准备调整星轨"}</b><small>确认后才会写入 Liva</small></div></header>
                {pending.type === "batch" ? (
                  <div className="assistant-batch-actions">
                    {pending.actions.map((action, index) => <div key={`${action.title}-${index}`}><b>{index + 1}</b><span>{action.title || "待确认事项"}</span><small>{action.status || "待安排"}</small></div>)}
                  </div>
                ) : <>
                  <div><span>操作</span><strong>{{ create_task: "新建待办", update_task: "修改待办", complete_task: "完成待办", delete_task: "删除待办", create: "新建待办" }[pending.type] || "调整事项"}</strong></div>
                  <div><span>事项</span><strong>{pending.title || tasks.find((task) => task.id === pending.taskId)?.title || "待确认事项"}</strong></div>
                  {(pending.date || pending.time || pending.repeat || pending.scheduleLabel) && <div><span>时间</span><strong>{pending.scheduleLabel || [pending.date, pending.time, repeatLabel(pending.repeat)].filter(Boolean).join(" · ")}</strong></div>}
                  {pending.tag && <div><span>归属</span><strong>{pending.tag}</strong></div>}
                  {pending.status && <div><span>状态</span><strong>{pending.status}</strong></div>}
                </>}
                <footer><button onClick={() => setPending(null)}>暂不执行</button><button onClick={confirmCreate}><Check /> 确认执行</button></footer>
              </article>
            )}
          </div>
          {messages.length === 1 && (
            <div className="assistant-suggestions">
              {suggestions.map(([label, prompt]) => <button onClick={() => respond(prompt)} key={label}><span>{label}</span><ChevronRight /></button>)}
            </div>
          )}
          <form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); respond(draft); }}>
            <button type="button" aria-label="语音输入"><Mic /></button>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="和微光说说，或交给它一件事…" />
            <button className="assistant-send" type="submit" disabled={!draft.trim() || isThinking || isSending} aria-label="发送"><Send /></button>
          </form>
          <p className="assistant-note">涉及修改的操作，会先向你确认</p>
        </section>
        <aside className="assistant-context">
          <section className="assistant-identity">
            <div className="assistant-star-portrait"><Sparkles /><span className="star-orbit" /></div>
            <div><small>你的生活星光</small><h2>微光</h2><p>一颗温柔、清醒，也很会发现重点的小星星。它记得你的节奏，每次改变生活星轨前都会先问你。</p></div>
          </section>
          <section className="assistant-brief">
            <h3>今天值得留意</h3>
            <div className="assistant-attention-list">
              <div><CircleAlert /><span><b>{activeTasks.length ? `还有 ${activeTasks.length} 件事项待处理` : "今天的事情都安顿好了"}</b><small>{lateTasks.length ? `${lateTasks.length} 件需要重新安排，建议先处理` : `已经完成 ${completedTasks.length} 件，按现在的节奏就好`}</small></span></div>
              <div><CalendarDays /><span><b>{nextTimedTask ? `${(`${nextTimedTask.clock || nextTimedTask.time}`).match(/\d{1,2}:\d{2}/)?.[0]}　${nextTimedTask.title}` : "今天暂无固定时间安排"}</b><small>{nextTimedTask ? `${nextTimedTask.tag || "生活事项"} · 到点前会再提醒你` : "随时可以让微光帮你安排"}</small></span></div>
            </div>
            <button onClick={() => respond("微光，播报一下今天的安排")}>查看今日安排 <ChevronRight /></button>
          </section>
          <section className="assistant-broadcast">
            <header><h3>提醒设置</h3><button aria-label="播报设置" onClick={() => openModal("settings")}><Settings /></button></header>
            <div className="assistant-reminder-row"><Bell /><span><b>晚间播报　21:30</b><small>汇总当天进展与明日安排</small></span><button className={`assistant-broadcast-switch ${broadcastEnabled ? "on" : ""}`} aria-label="晚间播报开关" aria-pressed={broadcastEnabled} onClick={() => setBroadcastEnabled((value) => !value)}><i /></button></div>
            <button className="assistant-reminder-link" onClick={() => openModal("settings")}>调整提醒时间 <ChevronRight /></button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function QuickSidebar({
  page,
  navigate,
  openModal,
  collapsed,
  setCollapsed,
  tasks,
  assistantUnread,
}) {
  const [active, setActive] = useState("dashboard-top"),
    items = [
      ["dashboard-top", "首页", Home],
      ["life-map", "人生版图", Compass],
      ["life-content", "生活事项", BookOpen],
      ["today-todos", "今日行动", ListChecks],
      ["daily-review", "本日记录", CheckCircle2],
    ],
    activeCount = tasks.filter((t) => !t.done && !t.archived).length,
    arrangedCount = tasks.filter(
      (t) => !t.done && !t.archived && /\d{1,2}:\d{2}/.test(t.time),
    ).length,
    completedCount = tasks.filter((t) => t.done && !t.archived).length;
  const jump = (id) => {
    setActive(id);
    if (page !== "today") navigate("today");
    window.setTimeout(
      () =>
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      page === "today" ? 0 : 80,
    );
  };
  return (
    <aside
      className={`quick-sidebar ${collapsed ? "is-collapsed" : ""}`}
      aria-label="板块快捷导航"
    >
      <nav>
        <button
          className={`sidebar-assistant ${page === "assistant" ? "active" : ""} ${assistantUnread ? "has-assistant-unread" : ""}`.trim()}
          onClick={() => navigate("assistant")}
          title="微光"
          aria-label="打开微光助手"
        >
          <Sparkles />
          <span>微光</span>
        </button>
        {items.map(([id, label, Icon]) => (
          <button
            className={active === id ? "active" : ""}
            onClick={() => jump(id)}
            title={label}
            aria-label={label}
            key={id}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-insights">
        <section>
          <h3>生活版图</h3>
          {realms.map((realm) => (
            <button
              className="sidebar-realm-row"
              onClick={() => jump("life-map")}
              key={realm.name}
            >
              <i style={{ background: realm.color }} />
              <span>{realm.name}</span>
              <b>{matters.filter((matter) => matter.realm === realm.name && !matter.archived).length}</b>
            </button>
          ))}
        </section>
        <section>
          <h3>今日状态</h3>
          <div className="sidebar-status-row">
            <RefreshCw />
            <span>进行中</span>
            <b>{activeCount}</b>
          </div>
          <div className="sidebar-status-row">
            <Clock3 />
            <span>已安排</span>
            <b>{arrangedCount}</b>
          </div>
          <div className="sidebar-status-row">
            <CheckCircle2 />
            <span>已完成</span>
            <b>{completedCount}</b>
          </div>
        </section>
      </div>
      <footer>
        <button
          onClick={() => openModal("note")}
          title="灵感"
          aria-label="灵感"
        >
          <Lightbulb />
        </button>
        <button
          onClick={() => openModal("profilePanel")}
          title="设置"
          aria-label="设置"
        >
          <Settings />
        </button>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "展开侧边栏" : "收起侧边栏"}
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>
      </footer>
    </aside>
  );
}

function MobileNav({ page, navigate, openModal, assistantUnread }) {
  return (
    <nav className="mobile-nav">
      <button
        className={page === "today" ? "active" : ""}
        onClick={() => navigate("today")}
      >
        <Home />
        <span>首页</span>
      </button>
      <button
        className={["todo", "timeline"].includes(page) ? "active" : ""}
        onClick={() => navigate("todo")}
      >
        <ListChecks />
        <span>待办</span>
      </button>
      <button
        className={`${page === "assistant" ? "active" : ""} ${assistantUnread ? "has-assistant-unread" : ""}`.trim()}
        onClick={() => navigate("assistant")}
        aria-label={assistantUnread ? "微光有新消息" : "打开微光"}
      >
        <span className="mobile-nav-icon"><Sparkles />{assistantUnread && <i className="assistant-unread-dot" />}</span>
        <span>微光</span>
      </button>
      <button
        className={page === "profile" ? "active" : ""}
        onClick={() => navigate("profile")}
      >
        <CircleUserRound />
        <span>我的</span>
      </button>
    </nav>
  );
}

function MobileQuickCapture({ page, openModal }) {
  const [open, setOpen] = useState(false),
    visible = ["today", "todo"].includes(page),
    choose = (modal) => {
      setOpen(false);
      openModal(modal);
    };
  useEffect(() => setOpen(false), [page]);
  if (!visible) return null;
  return (
    <div className={`mobile-quick-capture ${open ? "is-open" : ""}`}>
      {open && (
        <button
          className="mobile-quick-scrim"
          onClick={() => setOpen(false)}
          aria-label="关闭快捷操作"
        />
      )}
      {open && (
        <div className="mobile-quick-menu" role="menu">
          <button onClick={() => choose("addTodo")} role="menuitem">
            <span className="todo-tone"><ListChecks /></span>
            <div><b>新建待办</b><small>记录一件需要完成的事</small></div>
          </button>
          <button onClick={() => choose("note")} role="menuitem">
            <span className="idea-tone"><Lightbulb /></span>
            <div><b>记录灵感</b><small>留住突然出现的想法</small></div>
          </button>
        </div>
      )}
      <button
        className="mobile-quick-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "关闭快捷操作" : "打开快捷操作"}
        aria-expanded={open}
      >
        <Plus />
      </button>
    </div>
  );
}

function ProfileEditModal({ close }) {
  const { profile, saveProfile } = useLivaProfile();
  const [draft, setDraft] = useState(profile);
  const submit = (event) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) return;
    saveProfile({
      name,
      initials: (draft.initials.trim() || name.slice(0, 1)).slice(0, 2).toUpperCase(),
      bio: draft.bio.trim() || defaultProfile.bio,
    });
    close();
  };
  return (
    <div className="modal-backdrop profile-edit-backdrop" onClick={close}>
      <section className="profile-edit-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="关闭"><X /></button>
        <header>
          <span className="profile-edit-preview">{draft.initials || draft.name.slice(0, 1) || "M"}</span>
          <div><h2>编辑资料</h2><p>这些信息会同步显示在电脑端和手机端。</p></div>
        </header>
        <form onSubmit={submit}>
          <label><span>称呼</span><input autoFocus maxLength="20" value={draft.name} onChange={(e) => setDraft((value) => ({ ...value, name: e.target.value }))} placeholder="你的称呼" /></label>
          <label><span>头像文字</span><input maxLength="2" value={draft.initials} onChange={(e) => setDraft((value) => ({ ...value, initials: e.target.value }))} placeholder="1–2 个字符" /></label>
          <label className="profile-edit-bio"><span>个人说明</span><textarea maxLength="60" value={draft.bio} onChange={(e) => setDraft((value) => ({ ...value, bio: e.target.value }))} placeholder="写一句关于自己的话" /><small>{draft.bio.length}/60</small></label>
          <footer><button type="button" onClick={close}>取消</button><button className="profile-edit-save" type="submit"><Check /> 保存资料</button></footer>
        </form>
      </section>
    </div>
  );
}

function serializeCloudState(tasks, profile = savedProfile) {
  return {
    version: 1,
    tasks,
    profile,
    inspirationMemos,
    realms: realms.map(({ Icon, ...realm }) => realm),
    matters: matters.map(({ Icon, todos, ...matter }) => matter),
  };
}
function restoreCloudState(snapshot) {
  if (!snapshot) return;
  const realmIcons = new Map(realms.map((r) => [r.name, r.Icon])),
    matterIcons = new Map(
      matters.map((m) => [`${m.realm}:${m.title}`, m.Icon]),
    );
  if (Array.isArray(snapshot.realms)) {
    realms.splice(
      0,
      realms.length,
      ...snapshot.realms.map((realm, index) => ({
        ...realm,
        note: getRealmNote(realm),
        Icon:
          realmIcons.get(realm.name) ||
          [BriefcaseBusiness, Heart, Leaf, Settings2][index % 4],
      })),
    );
  }
  if (Array.isArray(snapshot.matters)) {
    matters.splice(
      0,
      matters.length,
      ...snapshot.matters.map((matter, index) => ({
        ...matter,
        Icon:
          matterIcons.get(`${matter.realm}:${matter.title}`) ||
          directionIcons[index % directionIcons.length],
        todos: [],
      })),
    );
  }
  if (Array.isArray(snapshot.inspirationMemos))
    persistInspirationMemos(snapshot.inspirationMemos);
}

function ModalLayer({
  modal,
  close,
  navigate,
  tasks,
  setTasks,
  openModal,
  refresh,
  notificationReadIds,
  setNotificationReadIds,
  closeParentAndSelf,
  depth,
  user,
  onSignOut,
}) {
  if (modal === "profile") return <ProfileEditModal close={close} />;
  if (modal?.startsWith("todoEdit-")) {
    const task = tasks.find((t) => t.id === Number(modal.split("-")[1]));
    return <TodoEditModal task={task} setTasks={setTasks} close={close} />;
  }
  if (modal?.startsWith("deleteRealm-"))
    return (
      <DeleteConfirmModal
        kind="realm"
        index={Number(modal.split("-")[1])}
        close={close}
        onDeleted={() => {
          refresh();
          closeParentAndSelf();
        }}
        setTasks={setTasks}
      />
    );
  if (modal?.startsWith("deleteMatter-"))
    return (
      <DeleteConfirmModal
        kind="matter"
        index={Number(modal.split("-")[1])}
        close={close}
        onDeleted={() => {
          refresh();
          closeParentAndSelf();
        }}
        setTasks={setTasks}
      />
    );
  if (modal === "notice")
    return (
      <NotificationPanel
        close={close}
        tasks={tasks}
        readIds={notificationReadIds}
        setReadIds={setNotificationReadIds}
        openModal={openModal}
      />
    );
  if (modal === "profilePanel")
    return (
      <ProfilePanel
        close={close}
        openModal={openModal}
        tasks={tasks}
        setTasks={setTasks}
        onDataChange={refresh}
        user={user}
        onSignOut={onSignOut}
      />
    );
  if (modal === "archive")
    return (
      <ProfilePanel
        close={close}
        openModal={openModal}
        tasks={tasks}
        setTasks={setTasks}
        onDataChange={refresh}
        user={user}
        onSignOut={onSignOut}
        initialView="archive"
      />
    );
  if (modal === "login") return <LoginModal close={close} />;
  if (modal === "addRealm")
    return <NewRealmModal close={close} onCreated={refresh} />;
  if (modal === "addDirection" || modal?.startsWith("addDirection:"))
    return (
      <AddDirectionModal
        close={close}
        onCreated={refresh}
        initialRealmName={
          modal.includes(":")
            ? decodeURIComponent(modal.slice(modal.indexOf(":") + 1))
            : ""
        }
      />
    );
  if (modal?.startsWith("content-"))
    return (
      <ContentDetailModal
        item={matters[Number(modal.split("-")[1])]}
        tasks={tasks}
        setTasks={setTasks}
        openModal={openModal}
        close={close}
        onDataChange={refresh}
        nested={depth > 0}
      />
    );
  return (
    <Modal
      type={modal}
      close={close}
      navigate={navigate}
      tasks={tasks}
      setTasks={setTasks}
      onDataChange={refresh}
    />
  );
}

const MemoMapPage = React.memo(MapPage);
const MemoMattersPage = React.memo(MattersPage);
const MemoProfilePage = React.memo(ProfilePage);
const MemoMobileNav = React.memo(MobileNav);

function App() {
  const [page, setPage] = useState(() =>
      window.matchMedia?.("(max-width: 800px)").matches ? "todo" : "today",
    ),
    [modalStack, setModalStack] = useState([]),
    [closingLayers, setClosingLayers] = useState([]),
    [tasks, setTasks] = useState(initialTasks),
    [notificationReadIds, setNotificationReadIds] = useState([]),
    [assistantUnread, setAssistantUnread] = useState(() => localStorage.getItem("liva-assistant-unread") === "1"),
    [sidebarCollapsed, setSidebarCollapsed] = useState(true),
    [realmVersion, setRealmVersion] = useState(0),
    [user, setUser] = useState(null),
    [profile, setProfile] = useState(savedProfile);
  const pageRef = useRef(page);
  pageRef.current = page;
  const saveProfile = React.useCallback((nextProfile) => {
    setProfile(nextProfile);
    localStorage.setItem("liva-profile", JSON.stringify(nextProfile));
  }, []);
  const [cloudReady, setCloudReady] = useState(!isSupabaseConfigured);
  useEffect(() => {
    let indicated = null;
    const clearIndicator = () => {
      indicated?.classList.remove("is-drop-target");
      indicated?.removeAttribute("data-drop-edge");
      indicated = null;
    };
    const indicateDrop = (event) => {
      const target = event.target instanceof Element
        ? event.target.closest('[data-touch-order], [draggable="true"]')
        : null;
      if (!target) return;
      if (target !== indicated) {
        clearIndicator();
        indicated = target;
        indicated.classList.add("is-drop-target");
      }
      const rect = target.getBoundingClientRect();
      target.dataset.dropEdge = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    };
    document.addEventListener("dragover", indicateDrop, true);
    document.addEventListener("drop", clearIndicator, true);
    document.addEventListener("dragend", clearIndicator, true);
    return () => {
      clearIndicator();
      document.removeEventListener("dragover", indicateDrop, true);
      document.removeEventListener("drop", clearIndicator, true);
      document.removeEventListener("dragend", clearIndicator, true);
    };
  }, []);
  useEffect(() => {
    const scrollTimers = new Map();
    const markScrolling = (event) => {
      const target =
        event.target === document
          ? document.scrollingElement || document.documentElement
          : event.target instanceof HTMLElement
            ? event.target
            : document.documentElement;
      target.classList.add("is-scrolling");
      const previousTimer = scrollTimers.get(target);
      if (previousTimer) window.clearTimeout(previousTimer);
      scrollTimers.set(
        target,
        window.setTimeout(() => {
          target.classList.remove("is-scrolling");
          scrollTimers.delete(target);
        }, 700),
      );
    };

    document.addEventListener("scroll", markScrolling, true);
    return () => {
      document.removeEventListener("scroll", markScrolling, true);
      scrollTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user || null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) window.dispatchEvent(new Event("liva-auth-changed"));
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const onSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    loadCloudSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        if (snapshot) {
          restoreCloudState(snapshot);
          if (Array.isArray(snapshot.tasks)) setTasks(snapshot.tasks);
          if (snapshot.profile) saveProfile({ ...defaultProfile, ...snapshot.profile });
          setRealmVersion((v) => v + 1);
        }
        setCloudReady(true);
      })
      .catch((error) => {
        console.warn("Supabase load skipped:", error.message);
        setCloudReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!isSupabaseConfigured || !cloudReady) return;
    const timer = window.setTimeout(
      () =>
        saveCloudSnapshot(serializeCloudState(tasks, profile)).catch((error) =>
          console.warn("Supabase save skipped:", error.message),
        ),
      700,
    );
    return () => window.clearTimeout(timer);
  }, [tasks, realmVersion, cloudReady, profile]);
  useEffect(() => {
    const reloadAfterAuth = () => {
      loadCloudSnapshot()
        .then((snapshot) => {
          if (snapshot?.tasks) setTasks(snapshot.tasks);
          if (snapshot?.profile) saveProfile({ ...defaultProfile, ...snapshot.profile });
          if (snapshot) {
            restoreCloudState(snapshot);
            setRealmVersion((v) => v + 1);
          }
        })
        .catch((error) => console.warn("Supabase sync skipped:", error.message));
    };
    window.addEventListener("liva-auth-changed", reloadAfterAuth);
    return () => window.removeEventListener("liva-auth-changed", reloadAfterAuth);
  }, []);
  const openModal = React.useCallback((next) => {
    if (!next) return;
    setModalStack((stack) => [...stack, next]);
  }, []);
  const closeLayer = (index) => {
    if (closingLayers.includes(index)) return;
    setClosingLayers((current) => [...current, index]);
    window.setTimeout(() => {
      setModalStack((stack) => stack.slice(0, index));
      setClosingLayers((current) => current.filter((layer) => layer < index));
    }, 180);
  };
  const navigate = React.useCallback((p) => {
    if (p.startsWith("todoEdit-")) {
      openModal(p);
      return;
    }
    if (p === "assistant") {
      setAssistantUnread(false);
      localStorage.removeItem("liva-assistant-unread");
    }
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [openModal]);
  let content;
  if (page === "map")
    content = <MemoMapPage navigate={navigate} openModal={openModal} />;
  else if (page === "matters")
    content = <MemoMattersPage navigate={navigate} openModal={openModal} tasks={tasks} />;
  else if (page === "todo")
    content = (
      <TodoPage
        navigate={navigate}
        openModal={openModal}
        tasks={tasks}
        setTasks={setTasks}
      />
    );
  else if (page === "timeline")
    content = window.matchMedia?.("(max-width: 800px)").matches ? (
      <TodoPage
        navigate={navigate}
        openModal={openModal}
        tasks={tasks}
        setTasks={setTasks}
      />
    ) : (
      <TimelinePage
        navigate={navigate}
        openModal={openModal}
        tasks={tasks}
        setTasks={setTasks}
      />
    );
  else if (page === "profile")
    content = <MemoProfilePage navigate={navigate} openModal={openModal} />;
  else if (page === "assistant")
    content = (
      <AssistantPage
        tasks={tasks}
        setTasks={setTasks}
        navigate={navigate}
        openModal={openModal}
        onAssistantReply={() => {
          if (document.hidden || pageRef.current !== "assistant") {
            setAssistantUnread(true);
            localStorage.setItem("liva-assistant-unread", "1");
          }
        }}
      />
    );
  else if (page.startsWith("realm-"))
    content = (
      <RealmPage
        realm={realms[Number(page.split("-")[1])]}
        navigate={navigate}
        openModal={openModal}
      />
    );
  else
    content = (
      <Dashboard
        navigate={navigate}
        openModal={openModal}
        tasks={tasks}
        setTasks={setTasks}
        realmVersion={realmVersion}
      />
    );
  const refresh = () => setRealmVersion((v) => v + 1);
  return (
    <ProfileContext.Provider value={{ profile, saveProfile }}>
    <div
      className={`shell with-quick-sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <QuickSidebar
        page={page}
        navigate={navigate}
        openModal={openModal}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        tasks={tasks}
        assistantUnread={assistantUnread}
      />
      <main className="app">
        <div className="mobile-page-transition" key={page}>
          {content}
        </div>
      </main>
      {createPortal(
        <>
          <MemoMobileNav page={page} navigate={navigate} openModal={openModal} assistantUnread={assistantUnread} />
          <MobileQuickCapture page={page} openModal={openModal} />
        </>,
        document.body,
      )}
      {modalStack.map((entry, index) => (
        <div
          className={`modal-layer ${closingLayers.includes(index) ? "is-closing" : ""}`}
          style={{ "--modal-depth": index }}
          key={`${entry}-${index}`}
        >
          <ModalLayer
            modal={entry}
            close={() => closeLayer(index)}
            navigate={navigate}
            tasks={tasks}
            setTasks={setTasks}
            openModal={openModal}
            refresh={refresh}
            notificationReadIds={notificationReadIds}
            setNotificationReadIds={setNotificationReadIds}
            closeParentAndSelf={() =>
              setModalStack((stack) => stack.slice(0, Math.max(0, index - 1)))
            }
            depth={index}
            user={user}
            onSignOut={onSignOut}
          />
        </div>
      ))}
    </div>
    </ProfileContext.Provider>
  );
}

function DeleteConfirmModal({ kind, index, close, onDeleted, setTasks }) {
  const isRealm = kind === "realm",
    target = isRealm ? realms[index] : matters[index];
  if (!target) return null;
  const name = isRealm ? target.name : target.title,
    linkedTitles = isRealm ? [...target.directions] : [target.title],
    confirm = () => {
      if (isRealm) {
        for (let i = matters.length - 1; i >= 0; i--)
          if (matters[i].realm === target.name) matters.splice(i, 1);
        realms.splice(index, 1);
      } else {
        const realm = realms.find((r) => r.name === target.realm);
        if (realm)
          realm.directions = realm.directions.filter(
            (title) => title !== target.title,
          );
        matters.splice(index, 1);
      }
      setTasks((v) =>
        v.map((task) =>
          linkedTitles.includes(task.tag) ? { ...task, tag: "收集箱" } : task,
        ),
      );
      onDeleted();
      close();
    };
  return (
    <div className="modal-backdrop delete-confirm-backdrop" onClick={close}>
      <section
        className="delete-confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={close} aria-label="关闭">
          <X />
        </button>
        <span className="delete-confirm-icon">
          <Trash2 />
        </span>
        <h2>删除“{name}”吗？</h2>
        <p>
          {isRealm
            ? "这块版图及其中的事项将被移除。"
            : "这个事项将从所属版图中移除。"}
          关联待办不会被删除，会保留到收集箱。
        </p>
        <footer>
          <button onClick={close}>取消</button>
          <button className="confirm-delete" onClick={confirm}>
            <Trash2 /> 确认删除
          </button>
        </footer>
      </section>
    </div>
  );
}
function MatterTaskCard({ task, setTasks, openModal, compact = false }) {
  const states = ["待安排", "进行中", "已完成"],
    storedStatus = task.matterStatus === "已结束" ? "已完成" : task.matterStatus,
    status = task.done ? "已完成" : storedStatus || "进行中",
    statusClass =
      status === "进行中"
        ? "ongoing"
        : status === "待安排"
          ? "pending"
          : "ended",
    cycleStatus = (e) => {
      e.stopPropagation();
      const next = states[(states.indexOf(status) + 1) % states.length];
      setTasks((current) =>
        current.map((item) => {
          if (item.id !== task.id) return item;
          if (next === "进行中")
            return {
              ...item,
              done: false,
              archived: false,
              matterStatus: next,
              completedAt: null,
              date: "",
              clock: "",
              time: "随时待办",
            };
          if (next === "待安排")
            return {
              ...item,
              done: false,
              archived: false,
              matterStatus: next,
              completedAt: null,
            };
          return {
            ...item,
            done: true,
            archived: false,
            matterStatus: next,
            completedAt: new Date().toISOString(),
          };
        }),
      );
    };
  return (
    <article
      className={`matter-task-row status-${statusClass}${compact ? " compact" : ""}`}
      role="button"
      tabIndex="0"
      onClick={() => openModal(`todoEdit-${task.id}`)}
      onKeyDown={(e) => e.key === "Enter" && openModal(`todoEdit-${task.id}`)}
    >
      <button
        className="matter-task-status-dot"
        onClick={cycleStatus}
        aria-label={`当前状态${status}，点击切换`}
        title={`当前：${status}，点击切换`}
      >
        <i />
      </button>
      <div>
        <h4>
          {task.title}
          <span className="matter-task-status-label">{status}</span>
        </h4>
        <p>{task.time}</p>
      </div>
      <ChevronRight />
    </article>
  );
}

function ContentDetailModal({
  item,
  tasks,
  setTasks,
  openModal,
  close,
  onDataChange,
  nested = false,
}) {
  const [editingTitle, setEditingTitle] = useState(false),
    [titleDraft, setTitleDraft] = useState(item.title),
    [draggedTaskId, setDraggedTaskId] = useState(null);
  const realm = realms.find((r) => r.name === item.realm),
    Icon = iconForMatterName(item.title),
    linkedTasks = tasks.filter((task) => task.tag === item.title),
    currentTasks = linkedTasks.filter((task) => !task.done),
    activeTasks = currentTasks.filter((task) => task.matterStatus !== "待安排"),
    pendingTasks = currentTasks.filter(
      (task) => task.matterStatus === "待安排",
    ),
    completedTasks = linkedTasks.filter((task) => task.done),
    orderedOpenTasks = [...activeTasks, ...pendingTasks].sort((a, b) => {
      const key = (task) =>
        task.date && task.clock
          ? `${task.date}T${task.clock}`
          : task.date || "9999-12-31T99:99";
      return key(a).localeCompare(key(b));
    });
  const saveTitle = () => {
    const nextTitle = titleDraft.trim();
    if (!nextTitle || nextTitle === item.title) {
      setTitleDraft(item.title);
      setEditingTitle(false);
      return;
    }
    const oldTitle = item.title;
    item.title = nextTitle;
    item.Icon = iconForMatterName(nextTitle);
    if (realm) {
      realm.directions = realm.directions.map((title) =>
        title === oldTitle ? nextTitle : title,
      );
    }
    setTasks((current) =>
      current.map((task) =>
        task.tag === oldTitle ? { ...task, tag: nextTitle } : task,
      ),
    );
    setEditingTitle(false);
    onDataChange?.();
  };
  const reorderTask = (targetId) => {
    if (draggedTaskId === null || draggedTaskId === targetId) return;
    setTasks((current) => {
      const next = [...current],
        from = next.findIndex((task) => task.id === draggedTaskId),
        to = next.findIndex((task) => task.id === targetId);
      if (from < 0 || to < 0) return current;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedTaskId(null);
  };
  return (
    <div
      className={`modal-backdrop content-detail-backdrop ${nested ? "nested-content-detail-backdrop" : ""}`}
      onClick={close}
    >
      <section
        className={`content-detail-modal ${nested ? "nested-content-detail-modal" : ""}`}
        style={{ "--c": realm.color, "--t": realm.tint }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={close}>
          <X />
        </button>
        <button
          className="secondary-delete"
          onClick={() => openModal(`deleteMatter-${matters.indexOf(item)}`)}
        >
          <Trash2 /> 删除事项
        </button>
        <header>
          <span>
            <Icon />
          </span>
          <div className="content-title-edit-wrap">
            {editingTitle ? (
              <input
                className="content-title-input"
                value={titleDraft}
                autoFocus
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
                onBlur={saveTitle}
                aria-label="编辑事项名称"
              />
            ) : (
              <button
                className="content-title-button"
                onClick={() => setEditingTitle(true)}
                title="编辑事项名称"
              >
                <h2>{item.title}</h2>
              </button>
            )}
            <p>
              {item.realm} · {getRealmNote(realm)}
            </p>
          </div>
          <div className="content-numbers">
            <span>
              <b>{linkedTasks.length}</b> 全部待办
            </span>
            <span>
              <b>{activeTasks.length}</b> 正在推进
            </span>
            <span>
              <b>{completedTasks.length}</b> 已经完成
            </span>
          </div>
        </header>
        <div className="content-detail-body">
          <section>
            <div className="detail-heading">
              <div>
                <h3>具体内容</h3>
                <p>与“{item.title}”有关、现在需要处理的具体事情</p>
              </div>
              <button
                onClick={() =>
                  openModal(`addTodo:${encodeURIComponent(item.title)}`)
                }
              >
                <Plus /> 添加待办
              </button>
            </div>
            <div className="content-part-grid todo-link-grid">
              {activeTasks.length || pendingTasks.length ? (
                orderedOpenTasks.map((task) => (
                  <div
                    className="matter-task-drag-item"
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedTaskId(task.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      reorderTask(task.id);
                    }}
                    onDragEnd={() => setDraggedTaskId(null)}
                  >
                    <MatterTaskCard
                      task={task}
                      setTasks={setTasks}
                      openModal={openModal}
                    />
                  </div>
                ))
              ) : (
                <div className="direction-todo-empty">
                  <CheckCircle2 />
                  <b>暂时没有待办</b>
                  <p>需要行动时再从这里添加即可。</p>
                </div>
              )}
            </div>
          </section>
          <aside className="completed-todos">
            <div className="detail-heading">
              <div>
                <h3>最近完成</h3>
                <p>已经处理过的事情会留在这里</p>
              </div>
            </div>
            {completedTasks.length ? (
              completedTasks
                .slice(0, 4)
                .map((task) => (
                  <MatterTaskCard
                    key={task.id}
                    task={task}
                    setTasks={setTasks}
                    openModal={openModal}
                    compact
                  />
                ))
            ) : (
              <div className="completed-empty">
                <CheckCircle2 />
                <span>完成的待办会留在这里</span>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
function NotificationPanel({ close, tasks, readIds, setReadIds, openModal }) {
  const [tab, setTab] = useState("全部"),
    now = new Date(),
    today = now.toLocaleDateString("en-CA"),
    formatClock = (value) => (value ? value.slice(0, 5) : ""),
    taskRealm = (task) => realms.find((r) => r.directions.includes(task.tag)),
    openNotice = (notice) => {
      setReadIds((v) => (v.includes(notice.id) ? v : [...v, notice.id]));
      if (notice.taskId) {
        openModal(`todoEdit-${notice.taskId}`);
        return;
      }
      if (notice.matterIndex >= 0) {
        openModal(`content-${notice.matterIndex}`);
        return;
      }
      if (notice.category === "系统通知") openModal("profilePanel");
    };
  const notices = tasks.flatMap((task) => {
      if (task.archived) return [];
      const realm = taskRealm(task),
        tone =
          realm?.name === "Beauty"
            ? "rose"
            : realm?.name === "Soul"
              ? "green"
              : realm?.name === "Admin"
                ? "blue"
                : "amber",
        matterIndex = matters.findIndex((m) => m.title === task.tag),
        base = { taskId: task.id, matterIndex, category: "待办与事项", tone };
      if (task.done)
        return [
          {
            ...base,
            id: `done-${task.id}`,
            group: "今天",
            title: `“${task.title}”已完成`,
            desc: `${task.tag || "未归类"} · 已整理到完成事项`,
            time: task.completedAt
              ? new Date(task.completedAt).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "已完成",
            icon: CheckCircle2,
          },
        ];
      const taskDate = task.date || "",
        clock = formatClock(
          task.clock || /\d{1,2}:\d{2}/.exec(task.time || "")?.[0] || "",
        );
      if (task.level === "late")
        return [
          {
            ...base,
            id: `late-${task.id}`,
            group: "重要提醒",
            title: `“${task.title}”已逾期`,
            desc: `${task.tag || "未归类"} · 请重新安排时间`,
            time: "待处理",
            icon: CircleAlert,
          },
        ];
      if (taskDate === today && clock) {
        const start = new Date(`${taskDate}T${clock}:00`),
          minutes = Math.round((start - now) / 60000),
          desc =
            minutes > 0 && minutes <= 60
              ? `${minutes} 分钟后开始`
              : `${task.tag || "未归类"} · 已加入今日时间轴`;
        return [
          {
            ...base,
            id: `today-${task.id}-${taskDate}-${clock}`,
            group: minutes >= 0 && minutes <= 60 ? "重要提醒" : "今天",
            title: `${clock} ${task.title}`,
            desc,
            time: clock,
            icon: Clock3,
          },
        ];
      }
      if (taskDate === today)
        return [
          {
            ...base,
            id: `today-${task.id}-${taskDate}`,
            group: "今天",
            title: task.title,
            desc: `${task.tag || "未归类"} · 今天待处理`,
            time: "今天",
            icon: ListChecks,
          },
        ];
      return [];
    }),
    endedMatters = matters
      .map((matter, index) => ({ matter, index }))
      .filter(({ matter }) => matter.state === "结束")
      .map(({ matter, index }) => ({
        id: `ended-${matter.realm}-${matter.title}`,
        matterIndex: index,
        group: "更早",
        category: "内容与事项",
        title: `“${matter.title}”已归档`,
        desc: `${matter.realm} · 已从当前事项中收起`,
        time: "已结束",
        icon: Archive,
        tone: "amber",
      })),
    systemNotice = {
      id: "system-sync",
      group: "更早",
      category: "系统通知",
      title: "生活数据保存在当前设备",
      desc: "登录后可开启跨设备同步",
      time: "当前",
      icon: Cloud,
      tone: "blue",
    },
    allNotices = [...notices, ...endedMatters, systemNotice],
    visible =
      tab === "全部"
        ? allNotices
        : allNotices.filter((n) => n.category === tab),
    unreadCount = allNotices.filter((n) => !readIds.includes(n.id)).length,
    markAll = () => setReadIds(allNotices.map((n) => n.id));
  return (
    <div className="notice-backdrop" onClick={close}>
      <aside
        className="notification-panel live-notification-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <h2>通知</h2>
            {unreadCount > 0 && <b>{unreadCount}</b>}
          </div>
          <button onClick={close} aria-label="关闭">
            <X />
          </button>
        </header>
        <nav>
          {["全部", "待办与事项", "内容与事项", "系统通知"].map((item) => (
            <button
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="notification-scroll">
          {["重要提醒", "今天", "更早"].map((group) => {
            const groupItems = visible.filter((n) => n.group === group);
            return groupItems.length ? (
              <section className="notification-group" key={group}>
                <h3>{group}</h3>
                {groupItems.map((n) => {
                  const Icon = n.icon,
                    isRead = readIds.includes(n.id);
                  return (
                    <button
                      className={`notification-item ${isRead ? "is-read" : ""}`}
                      onClick={() => openNotice(n)}
                      key={n.id}
                    >
                      <span className={n.tone}>
                        <Icon />
                        {!isRead && <i />}
                      </span>
                      <div>
                        <b>{n.title}</b>
                        <small>{n.desc}</small>
                      </div>
                      <time>{n.time}</time>
                      <ChevronRight />
                    </button>
                  );
                })}
              </section>
            ) : null;
          })}
          {visible.length === 0 && (
            <div className="notification-empty">
              <CheckCircle2 />
              <b>这里暂时没有新提醒</b>
              <p>主页面的事项和待办发生变化后，会自动出现在这里。</p>
            </div>
          )}
        </div>
        <footer>
          <button onClick={() => openModal("profilePanel")}>
            <Settings2 /> 通知设置
          </button>
          <button onClick={markAll} disabled={unreadCount === 0}>
            {unreadCount === 0 ? "已全部读完" : "全部标为已读"} <Check />
          </button>
        </footer>
      </aside>
    </div>
  );
}

function TodoEditModal({ task, setTasks, close, compact = false }) {
  if (!task) return null;
  const initialRealm = realms.find((r) => r.directions.includes(task.tag)),
    [title, setTitle] = useState(task.title || ""),
    [selectedRealmName, setSelectedRealmName] = useState(
      initialRealm?.name || "",
    ),
    [tag, setTag] = useState(task.tag === "收集箱" ? "" : task.tag || ""),
    [date, setDate] = useState(
      task.date || new Date().toLocaleDateString("en-CA"),
    ),
    [time, setTime] = useState(
      task.clock || /\d{1,2}:\d{2}/.exec(task.time || "")?.[0] || "",
    ),
    [repeat, setRepeat] = useState(task.repeat || ""),
    [repeatInterval, setRepeatInterval] = useState(task.repeatInterval || 2),
    [repeatUnit, setRepeatUnit] = useState(task.repeatUnit || "day"),
    [repeatMode, setRepeatMode] = useState(task.repeatMode || "interval"),
    [repeatWeekdays, setRepeatWeekdays] = useState(task.repeatWeekdays || []),
    [note, setNote] = useState(task.note || ""),
    [subtasks, setSubtasks] = useState(task.subtasks || []),
    [subtaskDraft, setSubtaskDraft] = useState(""),
    [detailsOpen, setDetailsOpen] = useState(false);
  const realm = realms.find((r) => r.name === selectedRealmName) || realms[3],
    availableItems = selectedRealmName
      ? matters.filter(
          (item) => item.realm === selectedRealmName && item.state === "点亮",
        )
      : [],
    addSubtask = () => {
      if (!subtaskDraft.trim() || subtasks.length >= 5) return;
      setSubtasks((v) => [...v, subtaskDraft.trim()]);
      setSubtaskDraft("");
    },
    save = () => {
      if (!title.trim()) return;
      setTasks((v) =>
        v.map((t) =>
          t.id === task.id
            ? {
                ...t,
                title: title.trim(),
                tag: tag || "收集箱",
                date,
                clock: time,
                time: time ? `${date} ${time}` : date,
                note,
                repeat,
                repeatInterval,
                repeatUnit,
                repeatMode,
                repeatWeekdays,
                subtasks: subtasks.filter(Boolean),
              }
            : t,
        ),
      );
      close();
    },
    remove = () => {
      setTasks((v) => v.filter((t) => t.id !== task.id));
      close();
    };
  return (
    <div
      className={`modal-backdrop quick-todo-backdrop ${compact ? "tertiary-todo-backdrop" : ""}`}
      onClick={close}
    >
      <section
        className={`quick-todo-modal refined-quick-todo unified-todo-edit ${compact ? "compact-tertiary-todo" : ""}`}
        style={{ "--c": realm.color, "--t": realm.tint }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={close} aria-label="关闭">
          <X />
        </button>
        <header>
          <span>
            <ListChecks />
          </span>
          <div>
            <h2>编辑待办</h2>
            <p>调整这件事的归属、时间与补充内容</p>
          </div>
        </header>
        <div className="todo-edit-scroll">
        <label className="quick-title">
          <span>待办内容</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="准备做什么？"
          />
        </label>
        <section className="quick-form-section">
          <div className="quick-section-title">
            <span>详细信息</span>
          </div>
          <div className="quick-link-fields">
            <label>
              <span>
                <Compass /> 所属版图（可选）
              </span>
              <select
                value={selectedRealmName}
                onChange={(e) => {
                  const next = e.target.value;
                  setSelectedRealmName(next);
                  setTag("");
                }}
              >
                <option value="">不关联版图</option>
                {realms.map((r) => (
                  <option value={r.name} key={r.name}>
                    {r.name} · {getRealmNote(r)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>
                <BookOpen /> 所属事项（可选）
              </span>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                disabled={!selectedRealmName}
              >
                <option value="">
                  {selectedRealmName ? "不关联事项" : "请先选择版图"}
                </option>
                {availableItems.map((item) => (
                  <option value={item.title} key={item.title}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="quick-time-fields">
            <label>
              <span>
                <CalendarDays /> 日期
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
        <label>
          <span>
            <Clock3 /> 时间（可选）
              </span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <label>
          <span>重复</span>
          <select value={repeat} onChange={(e) => repeatChange(e, setRepeat, setRepeatInterval)}>
            <option value="">不重复</option>
            <option value="daily">每天</option>
            <option value="weekdays">每个工作日</option>
            <option value="weekends">每个周末</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
            <option value="yearly">每年</option>
            <option value="custom">自定义</option>
          </select>
          {repeat === "custom" && (
            <CustomRepeatFields interval={repeatInterval} setInterval={setRepeatInterval} unit={repeatUnit} setUnit={setRepeatUnit} weekdays={repeatWeekdays} setWeekdays={setRepeatWeekdays} mode={repeatMode} setMode={setRepeatMode} />
          )}
        </label>
          </div>
        </section>
        <section className="quick-form-section quick-details-section">
          <button
            className="quick-details-toggle"
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
          >
            <Settings2 />
            <span>{detailsOpen ? "收起设置" : "更多设置"}</span>
            <ChevronDown />
          </button>
          {detailsOpen && (
            <div className="quick-details-body">
              <label className="quick-note">
                <span>备注</span>
                <div>
                  <textarea
                    maxLength={200}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="地点、准备物品、联系方式……"
                  />
                  <small>{note.length}/200</small>
                </div>
              </label>
              <div className="quick-subtasks">
                <div className="quick-subtask-head">
                  <span>子任务</span>
                  <small>{subtasks.length}/5</small>
                </div>
                {subtasks.length > 0 && (
                  <div className="quick-subtask-list">
                    {subtasks.map((item, i) => (
                      <label key={i}>
                        <button
                          className="subtask-circle"
                          aria-label="标记子任务"
                        >
                          <Check />
                        </button>
                        <input
                          value={item}
                          onChange={(e) =>
                            setSubtasks((v) =>
                              v.map((x, n) => (n === i ? e.target.value : x)),
                            )
                          }
                          placeholder="输入子任务"
                        />
                        <button
                          onClick={() =>
                            setSubtasks((v) => v.filter((_, n) => n !== i))
                          }
                          aria-label="删除子任务"
                        >
                          <X />
                        </button>
                      </label>
                    ))}
                  </div>
                )}
                <div className="quick-subtask-add">
                  <input
                    value={subtaskDraft}
                    onChange={(e) => setSubtaskDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    placeholder="快速添加一个子任务…"
                  />
                  <button
                    onClick={addSubtask}
                    disabled={!subtaskDraft.trim() || subtasks.length >= 5}
                  >
                    <Plus /> 添加
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
        <footer className="unified-todo-footer">
          <button className="delete-todo" onClick={remove}>
            <Trash2 /> 删除待办
          </button>
          <div>
            <button onClick={close}>取消</button>
            <button
              className="quick-save"
              disabled={!title.trim()}
              onClick={save}
            >
              <Check /> 保存待办
            </button>
          </div>
        </footer>
        </div>
      </section>
    </div>
  );
}

function LifeReview({ tasks, navigate }) {
  const active = tasks.filter((t) => !t.done && !t.archived),
    completed = tasks.filter((t) => t.done && !t.archived),
    directionCount = new Set(tasks.map((t) => t.tag)).size,
    cards = [
      {
        label: "涉及事项",
        value: `${directionCount} 个`,
        note: "最近有内容流动的事项",
        icon: Compass,
        tone: "amber",
      },
      {
        label: "时间安排",
        value: "4 小时",
        note: "留给有明确时间的事",
        icon: Clock3,
        tone: "blue",
      },
      {
        label: "正在推进",
        value: `${active.length} 项`,
        note: "此刻仍在发生的事项",
        icon: ListChecks,
        tone: "green",
      },
      {
        label: "已完成",
        value: `${completed.length} 项`,
        note: "今天已经处理的事情",
        icon: CheckCircle2,
        tone: "rose",
      },
    ];
  return (
    <section id="daily-review" className="life-review panel">
      <header className="section-head">
        <div>
          <h2>本日回顾</h2>
          <p>轻轻看看最近留下了什么</p>
        </div>
        <time>2026年8月11日</time>
      </header>
      <div className="review-cards">
        {cards.map(({ label, value, note, icon: Icon, tone }) => (
          <article className={tone} key={label}>
            <span>
              <Icon />
            </span>
            <div>
              <small>{label}</small>
              <b>{value}</b>
              <p>{note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function NewRealmModal({ close, onCreated }) {
  const palette = [
      ["暖金", "#d3a646", "#fffaf0"],
      ["珊瑚", "#d68181", "#fff8f7"],
      ["草木", "#75a27f", "#f7fbf8"],
      ["湖蓝", "#789bc8", "#f7faff"],
      ["紫罗兰", "#9b83bd", "#faf8ff"],
      ["青绿", "#4fa3a5", "#f5fbfb"],
      ["陶橙", "#c47e4f", "#fff8f3"],
      ["石墨", "#69756f", "#f7f9f8"],
    ],
    icons = [
      BriefcaseBusiness,
      Heart,
      Leaf,
      Sparkles,
      Compass,
      House,
      GraduationCap,
      Mountain,
      Music,
      Users,
      Utensils,
      PawPrint,
      Dumbbell,
    ],
    [name, setName] = useState(""),
    [note, setNote] = useState(""),
    [colorIndex, setColorIndex] = useState(0),
    [iconIndex, setIconIndex] = useState(0),
    [label, color, tint] = palette[colorIndex],
    Icon = icons[iconIndex],
    save = () => {
      if (!name.trim()) return;
      realms.push({
        name: name.trim(),
        note: note.trim() || "我的生活领域",
        Icon,
        color,
        tint,
        intro: note.trim() || "为这一部分生活留出清晰、从容的空间。",
        directions: [],
      });
      onCreated();
      close();
    };
  return (
    <div className="modal-backdrop realm-create-backdrop" onClick={close}>
      <section
        className="realm-create-modal"
        style={{ "--realm-c": color, "--realm-t": tint }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={close} aria-label="关闭">
          <X />
        </button>
        <header>
          <span>
            <Icon />
          </span>
          <div>
            <h2>新建一块人生版图</h2>
            <p>为生活中重要的一部分，留一个清晰的位置</p>
          </div>
        </header>
        <div className="realm-create-layout">
          <div className="realm-create-form">
            <label>
              <span>版图名称</span>
              <input
                autoFocus
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：家庭、创作、学习…"
              />
            </label>
            <label>
              <span>一句话说明</span>
              <input
                maxLength={36}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="这块版图想容纳什么？"
              />
            </label>
            <fieldset>
              <legend>代表图标</legend>
              <div className="realm-icon-options">
                {icons.map((Choice, i) => (
                  <button
                    className={iconIndex === i ? "selected" : ""}
                    onClick={() => setIconIndex(i)}
                    key={i}
                  >
                    <Choice />
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>代表色</legend>
              <div className="realm-color-options">
                {palette.map(([tone, c], i) => (
                  <button
                    className={colorIndex === i ? "selected" : ""}
                    onClick={() => setColorIndex(i)}
                    aria-label={tone}
                    title={tone}
                    key={tone}
                  >
                    <i style={{ background: c }} />
                    {colorIndex === i && <Check />}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <aside>
            <small>实时预览</small>
            <article>
              <span>
                <Icon />
              </span>
              <h3>{name.trim() || "新的版图"}</h3>
              <p>{note.trim() || "为这部分生活留出空间"}</p>
              <em>
                <i /> 0 个生活事项
              </em>
            </article>
            <p>创建后，可以继续添加属于它的生活事项。</p>
          </aside>
        </div>
        <footer>
          <button onClick={close}>取消</button>
          <button
            className="realm-create-save"
            disabled={!name.trim()}
            onClick={save}
          >
            <Plus /> 创建版图
          </button>
        </footer>
      </section>
    </div>
  );
}
function LinkedMatters({ openModal, tasks, refreshVersion }) {
  const [orderedMatters, setOrderedMatters] = useState(() =>
      matters.filter((item) => item.state === "点亮").sort((a, b) => {
        const saved = JSON.parse(localStorage.getItem("liva-matter-order") || "[]"),
          ai = saved.indexOf(`${a.realm}:${a.title}`), bi = saved.indexOf(`${b.realm}:${b.title}`);
        return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      }),
    ),
    [draggedIndex, setDraggedIndex] = useState(null);
  useEffect(() => {
    setOrderedMatters((current) => {
      const active = matters.filter((item) => item.state === "点亮"),
        activeKeys = new Set(active.map((item) => `${item.realm}:${item.title}`)),
        currentKeys = new Set(),
        preserved = current.filter((item) => {
          const key = `${item.realm}:${item.title}`;
          if (!activeKeys.has(key) || currentKeys.has(key)) return false;
          currentKeys.add(key);
          return true;
        }),
        appended = active.filter(
          (item) => !currentKeys.has(`${item.realm}:${item.title}`),
        );
      return [...preserved, ...appended];
    });
  }, [refreshVersion]);
  const reorder = (from, to) => {
    if (from === null || from === to) return;
    setOrderedMatters((current) => {
      const next = [...current],
        [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const activeKeys = new Set(next.map((item) => `${item.realm}:${item.title}`)),
        inactive = matters.filter(
          (item) => !activeKeys.has(`${item.realm}:${item.title}`),
        );
      matters.splice(0, matters.length, ...next, ...inactive);
      return next;
    });
    setDraggedIndex(null);
  };
  const moveMatter = (source, target) => setOrderedMatters((current) => {
    const key = (item) => `${item.realm}:${item.title}`,
      next = [...current], from = next.findIndex((item) => key(item) === source), to = next.findIndex((item) => key(item) === target);
    if (from < 0 || to < 0) return current;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const active = new Set(next.map(key));
    matters.splice(0, matters.length, ...next, ...matters.filter((item) => !active.has(key(item))));
    localStorage.setItem("liva-matter-order", JSON.stringify(next.map(key)));
    return next;
  });
  const bindMatterTouch = useTouchReorder(moveMatter);
  return (
    <div className="goals linked-goals all-linked-goals">
      {orderedMatters.map((item, index) => {
        const matterIndex = matters.findIndex(
          (entry) => entry.realm === item.realm && entry.title === item.title,
        );
        return (
          <div
            className="draggable-matter-card"
            data-touch-order={`${item.realm}:${item.title}`}
            {...bindMatterTouch(`${item.realm}:${item.title}`)}
            draggable
            onDragStart={(e) => {
              setDraggedIndex(index);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", String(index));
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              reorder(draggedIndex, index);
            }}
            onDragEnd={() => setDraggedIndex(null)}
            key={`${item.realm}-${item.title}`}
          >
          <MatterCard
            item={item}
            index={matterIndex}
            openModal={openModal}
            tasks={tasks}
          />
          </div>
        );
      })}
    </div>
  );
}

applyAppearance(
  savedAppearance.theme,
  savedAppearance.density,
  savedAppearance.followSystem,
);
window
  .matchMedia?.("(prefers-color-scheme: dark)")
  .addEventListener?.("change", () => {
    const saved = JSON.parse(localStorage.getItem("liva-appearance") || "{}");
    if (saved.followSystem)
      applyAppearance(saved.theme || "自然", saved.density || "舒适", true);
  });
createRoot(document.getElementById("root")).render(<App />);
function AddDirectionModal({ close, onCreated, initialRealmName = "" }) {
  const [name, setName] = useState(""),
    [realmIndex, setRealmIndex] = useState(() => {
      const index = realms.findIndex((realm) => realm.name === initialRealmName);
      return index >= 0 ? index : 0;
    }),
    [kind, setKind] = useState("long"),
    selectedRealm = realms[realmIndex],
    SelectedIcon = name.trim() ? iconForMatterName(name) : selectedRealm.Icon;
  const save = () => {
    if (!name.trim()) return;
    const title = name.trim();
    realms[realmIndex].directions.push(title);
    matters.push({
      title,
      realm: selectedRealm.name,
      state: "点亮",
      kind: { long: "长期事项", habit: "日常习惯", project: "一次性项目" }[
        kind
      ],
      note: "承接日常里正在发生的具体事情",
      Icon: iconForMatterName(title),
      todos: [],
    });
    onCreated?.();
    close();
  };
  const kinds = [
    ["long", Compass, "长期事项", "持续了解和经营的生活事项"],
    ["habit", Clock3, "日常习惯", "想经常回来的日常实践"],
    ["project", CalendarDays, "一次性项目", "短期项目或阶段性的具体安排"],
  ];
  return (
    <div className="modal-backdrop direction-create-backdrop" onClick={close}>
      <section
        className="direction-create"
        style={{
          "--create-c": selectedRealm.color,
          "--create-t": selectedRealm.tint,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={close}>
          <X />
        </button>
        <header>
          <span>
            <SelectedIcon />
          </span>
          <div>
            <h2>开启一个新事项</h2>
            <p>把想法放进生活，慢慢靠近想成为的自己</p>
          </div>
        </header>
        <div className="create-field">
          <h3>
            <i /> 我想开始什么？
          </h3>
          <div className="direction-name">
            <input
              autoFocus
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：练习游泳 / 学习摄影 / 重新开始阅读…"
            />
            <span>{name.length}/30</span>
          </div>
          <p>
            <Sparkles /> 试试写成一个想长期靠近的生活事项
          </p>
        </div>
        <div className="create-field">
          <h3>
            <i /> 属于哪个领域？
          </h3>
          <div className="realm-picker">
            {realms.map((r, i) => {
              const Icon = r.Icon;
              return (
                <button
                  className={realmIndex === i ? "selected" : ""}
                  onClick={() => setRealmIndex(i)}
                  key={r.name}
                  style={{ "--c": r.color, "--t": r.tint }}
                >
                  <span>
                    <Icon />
                  </span>
                  <b>{r.name}</b>
                  <small>{getRealmNote(r)}</small>
                </button>
              );
            })}
          </div>
        </div>
        <div className="create-field">
          <h3>
            <i /> 这个事项以什么方式存在？
          </h3>
          <div className="kind-picker">
            {kinds.map(([id, Icon, title, desc]) => (
              <button
                className={kind === id ? "selected" : ""}
                onClick={() => setKind(id)}
                key={id}
              >
                <span>
                  <Icon />
                </span>
                <div>
                  <b>{title}</b>
                  <small>{desc}</small>
                </div>
                <i>{kind === id && <Check />}</i>
              </button>
            ))}
          </div>
        </div>
        <button
          className="create-submit"
          disabled={!name.trim()}
          onClick={save}
        >
          <Check /> 开启这个事项
        </button>
        <button className="create-later" onClick={close}>
          稍后再说
        </button>
      </section>
    </div>
  );
}
