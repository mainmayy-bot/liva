import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Archive,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
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
  MessageCircle,
  Mountain,
  Music,
  MoreHorizontal,
  NotebookPen,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PawPrint,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Utensils,
  Video,
  X,
} from "lucide-react";
import "./styles.css";
import "./refinements.css";
import "./mobile-home.css";
import "./mobile-depth.css";
import {
  isSupabaseConfigured,
  loadCloudSnapshot,
  saveCloudSnapshot,
} from "./lib/supabase";

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
    note: "事业与财富",
    Icon: BriefcaseBusiness,
    color: "#d8ad60",
    tint: "#fffdfa",
    intro:
      "关于工作、专业能力、收入与长期选择。它不是必须抵达的终点，而是你与现实世界建立关系的方式。",
    directions: ["日常工作", "专业成长", "财务整理", "长期选择"],
  },
  {
    name: "Beauty",
    note: "身体与美感",
    Icon: Heart,
    color: "#dda2a4",
    tint: "#fffafb",
    intro:
      "照顾身体的感受、能量和外在表达。这里容纳健康、运动、穿搭，以及一切让你更自在的实践。",
    directions: ["身体健康", "舒展运动", "个人风格", "日常护理"],
  },
  {
    name: "Soul",
    note: "精神世界",
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
    directions: ["日程整理", "空间维护", "资料归档", "关系联络"],
  },
];
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
  if (task.repeat === "weekly") return days % 7 === 0;
  if (task.repeat === "monthly") return target.getDate() === start.getDate();
  return false;
}

function repeatLabel(value) {
  return {
    daily: "每天",
    weekdays: "每个工作日",
    weekly: "每周",
    monthly: "每月",
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
  const rules = [
    [/工作|职业|项目|商业|财务|收入|合同|材料/, BriefcaseBusiness],
    [/阅读|学习|课程|考试|输入|书|写作/, BookOpen],
    [/运动|游泳|健身|跑步|健康|身体|舒展/, Dumbbell],
    [/旅行|出行|探索|路线|城市/, Compass],
    [/家庭|家务|空间|收纳|居住/, House],
    [/音乐|乐器|唱歌/, Music],
    [/关系|朋友|社交|沟通|联络/, Users],
    [/饮食|做饭|餐|咖啡/, Utensils],
    [/宠物|猫|狗/, PawPrint],
    [/摄影|视频|影像/, Video],
    [/成长|创作|灵感|表达/, Sparkles],
  ];
  return rules.find(([pattern]) => pattern.test(name))?.[1] || Sparkles;
}
const matters = realms.flatMap((realm) =>
  realm.directions.map((title, index) => ({
    title,
    realm: realm.name,
    state: directionStates[index],
    kind: matterKinds[index],
    note: directionNotes[index],
    Icon: iconForMatterName(title),
    todos: initialTasks.filter((task) => task.tag === title),
  })),
);

function Header({ title = "下午好， May", mobileTitle, openModal, navigate }) {
  return (
    <header className="topbar">
      <div>
        <p className="hello">
          {mobileTitle ? (
            <>
              <span className="header-title-default">{title}</span>
              <span className="header-title-mobile">{mobileTitle}</span>
            </>
          ) : title}{" "}
          <span className="wave" aria-hidden="true">
            🌿
          </span>
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
          M
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
    matterCount = matters.filter((matter) => matter.realm === realm.name).length,
    show = () => {
      window.__boardOpenModal = openModal;
      openModal(`realmModal-${index}`);
    };
  return (
    <article
      className="realm"
      onClick={show}
      style={{ "--c": realm.color, "--t": realm.tint }}
    >
      <div className="realm-top">
        <span className="realm-icon">
          <Icon />
        </span>
        <div>
          <h3>{realm.name}</h3>
          <p>{realm.note}</p>
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
    Icon = item.Icon,
    todoCount = tasks.filter(
      (task) => task.tag === item.title && !task.done,
    ).length;
  return (
    <article
      className="goal content-card"
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
  const [deleting, setDeleting] = useState([]);
  const toggle = (id) =>
    setTasks((v) => v.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
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
        {tasks.map((t) => (
          <article className={`${t.done ? "done" : ""} ${deleting.includes(t.id) ? "is-deleting" : ""}`} key={t.id}>
            <GripVertical className="drag" />
            <button
              className="task-check"
              onClick={() => toggle(t.id)}
              aria-label={`完成${t.title}`}
            >
              <Check />
            </button>
            <button
              className="task-copy"
              onClick={() => openModal(`todoEdit-${t.id}`)}
            >
              <b>{t.title}</b>
              {t.level === "late" && <em>已逾期</em>}
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
          </article>
        ))}
      </div>
      <button className="add-todo" onClick={() => openModal("addTodo")}>
        <Plus /> 添加待办
      </button>
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
}) {
  const [sortMode, setSortMode] = useState("manual"),
    [sortOpen, setSortOpen] = useState(false),
    [completing, setCompleting] = useState([]),
    [deleting, setDeleting] = useState([]),
    sortLabels = {
      manual: "手动排序",
      time: "按时间",
      realm: "按板块",
      status: "按状态",
    },
    active = tasks.filter(
      (t) =>
        !t.done &&
        !t.archived &&
        t.matterStatus !== "待安排" &&
        taskOccursOnDate(t, selectedDateKey),
    ),
    completed = tasks.filter(
      (t) => t.done && !t.archived && taskOccursOnDate(t, selectedDateKey),
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
        setTasks((v) =>
          v.map((item) =>
            item.id === id
              ? {
                  ...item,
                  done: true,
                  matterStatus: "已结束",
                  completedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
        setCompleting((v) => v.filter((item) => item !== id));
      }, 360);
    };
  const Cards = ({ items }) => (
    <div className="tasks">
      {items.map((t) => {
        const arranged = scheduled.some((s) => s.taskId === t.id),
          realm = realms.find((r) => r.directions.includes(t.tag)),
          isCompleting = completing.includes(t.id);
        return (
          <article
            className={`${arranged ? "arranged " : ""}${isCompleting ? "is-completing" : ""}${deleting.includes(t.id) ? " is-deleting" : ""}`}
            style={{
              "--task-color": realm?.color || "#8fa39a",
              "--task-tint": realm?.tint || "#f2f5f3",
            }}
            draggable={!isCompleting}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", JSON.stringify(t));
            }}
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
                reorderTask(source.id, t.id);
              } catch {}
            }}
            key={t.id}
          >
            <GripVertical className="drag" />
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
              <b>{t.title}</b>
              {t.level === "late" && <em>已逾期</em>}
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
      })}
    </div>
  );
  return (
    <Section
      id="today-todos"
      title="今日待办"
      className="today-todo card-list-todo schedule-todos"
      action={
        <button className="quick-add-todo" onClick={() => openModal("addTodo")}>
          <Plus /> 新建待办
        </button>
      }
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
        <span>正在推进</span>
        <div className="todo-sort-wrap">
          <button
            className="todo-sort-trigger"
            onClick={() => setSortOpen((v) => !v)}
            aria-expanded={sortOpen}
          >
            <Settings2 />
            <span>{sortLabels[sortMode]}</span>
            <ChevronDown />
          </button>
          {sortOpen && (
            <div className="todo-sort-menu">
              {Object.entries(sortLabels).map(([value, label]) => (
                <button
                  className={sortMode === value ? "active" : ""}
                  onClick={() => {
                    setSortMode(value);
                    setSortOpen(false);
                  }}
                  key={value}
                >
                  <span>{label}</span>
                  {sortMode === value && <Check />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="dashboard-task-scroll grouped-task-scroll">
        <Cards items={progress} />
        <div className="anytime-heading">
          <span>随时待办</span>
        </div>
        <Cards items={anytime} />
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
                          ? {
                              ...item,
                              done: false,
                              matterStatus: "进行中",
                              completedAt: null,
                              date: "",
                              clock: "",
                              time: "随时待办",
                            }
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
  const slotHeight = 64,
    hours = Array.from({ length: 24 }, (_, i) => i),
    scroller = useRef(null),
    datePicker = useRef(null),
    [scheduled, setScheduled] = useState(() =>
      tasks
        .filter((t) => t.date && t.clock && !t.done && !t.archived)
        .map((t) => ({
          id: t.id,
          taskId: t.id,
          title: t.title,
          start:
            Number(t.clock.split(":")[0]) +
            Number(t.clock.split(":")[1] || 0) / 60,
          duration: t.durationHours || 1,
          dateKey: t.date,
        })),
    ),
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
  const focusNow = () =>
    requestAnimationFrame(() => {
      if (scroller.current)
        scroller.current.scrollTo({
          top: Math.max(0, nowTop - scroller.current.clientHeight * 0.42),
          behavior: "smooth",
        });
    });
  useEffect(() => {
    setScheduled((current) => {
      const active = current.filter((s) =>
          tasks.some((t) => t.id === s.taskId && !t.done && !t.archived),
        ),
        timed = tasks.filter(
          (t) =>
            t.date &&
            t.clock &&
            !t.done &&
            !t.archived &&
            taskOccursOnDate(t, selectedKey),
        );
      return [
        ...active.filter((s) => !timed.some((t) => t.id === s.taskId)),
        ...timed.map((t) => {
          const existing = active.find((s) => s.taskId === t.id);
          return existing
            ? {
                ...existing,
                title: t.title,
                dateKey: selectedKey,
                start:
                  Number(t.clock.split(":")[0]) +
                  Number(t.clock.split(":")[1] || 0) / 60,
                duration: t.durationHours || existing.duration,
              }
            : {
                id: t.id,
                taskId: t.id,
                title: t.title,
                start:
                  Number(t.clock.split(":")[0]) +
                  Number(t.clock.split(":")[1] || 0) / 60,
                duration: t.durationHours || 1,
                dateKey: selectedKey,
              };
        }),
      ];
    });
  }, [tasks]);
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
    drop = (e, hour) => {
      e.preventDefault();
      try {
        const t = JSON.parse(e.dataTransfer.getData("text/plain"));
        setScheduled((v) =>
          v.some((s) => s.taskId === t.id)
            ? v.map((s) =>
                s.taskId === t.id
                  ? { ...s, start: hour, dateKey: selectedKey }
                  : s,
              )
            : [
                ...v,
                {
                  id: Date.now(),
                  taskId: t.id,
                  title: t.title,
                  start: hour,
                  duration: 1,
                  dateKey: selectedKey,
                },
              ],
        );
        const clock = `${String(hour).padStart(2, "0")}:00`;
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
      } catch {}
    };
  const resize = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY,
      current = scheduled.find((s) => s.id === id);
    const move = (ev) => {
      const change = Math.round((ev.clientY - startY) / (slotHeight / 2)) / 2;
      setScheduled((v) =>
        v.map((s) =>
          s.id === id
            ? {
                ...s,
                duration: Math.max(
                  0.5,
                  Math.min(24 - s.start, current.duration + change),
                ),
              }
            : s,
        ),
      );
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };
  const toneFor = (s) => {
    const task = tasks.find((t) => t.id === s.taskId),
      realm = realms.find((r) => r.directions.includes(task?.tag));
    return realm || realms[3];
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
          <div className="axis-grid">
            {hours.map((h) => (
              <div
                className="hour-row"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => drop(e, h)}
                key={h}
              >
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
              const tone = toneFor(s);
              return (
                <article
                  className="scheduled-block"
                  style={{
                    top: s.start * slotHeight + 2,
                    height: s.duration * slotHeight - 4,
                    "--schedule-color": tone.color,
                    "--schedule-tint": tone.tint,
                  }}
                  draggable
                  onDragStart={(e) => {
                    const task = tasks.find((item) => item.id === s.taskId);
                    if (!task) return;
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", JSON.stringify(task));
                  }}
                  key={s.id}
                >
                  <b>{s.title}</b>
                  <small>
                    {String(s.start).padStart(2, "0")}:00 · {s.duration}小时
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
        </button>
        <button className="completion-card" onClick={() => jumpTo("daily-review")}>
          <span>完成进度</span>
          <strong>{completion}%</strong>
          <small>{done.length} 项已完成</small>
          <i style={{ "--progress": `${completion * 3.6}deg` }} aria-hidden="true" />
        </button>
        <button onClick={() => navigate("timeline")}>
          <span>时间轴</span>
          <strong>{scheduled.length}</strong>
          <small>个日程安排</small>
        </button>
        <button onClick={() => jumpTo("life-content")}>
          <span>事项习惯</span>
          <strong>{matters.length}</strong>
          <small>个生活事项</small>
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
        <div className="time-compass-ring" style={{ "--progress": `${percent * 3.6}deg` }}>
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

function Dashboard({ navigate, openModal, tasks, setTasks }) {
  const [orderedRealms, setOrderedRealms] = useState(() => [...realms]);
  const [draggedRealm, setDraggedRealm] = useState(null);
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
            <div className="draggable-board-card" draggable onDragStart={(e) => {
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
        sub="把生活关注，拆成每天可做的小事"
        action={
          <button
            className="outline matter-add"
            onClick={() => openModal("addDirection")}
          >
            <Plus /> 新建事项
          </button>
        }
      >
        <LinkedMatters openModal={openModal} tasks={tasks} />
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
            <article style={{ "--c": r.color, "--t": r.tint }} key={r.name}>
              <header>
                <span>
                  <Icon />
                </span>
                <div>
                  <h2>{r.name}</h2>
                  <p>{r.note}</p>
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
    <div className="focus-page realm-focus-page" style={{ "--c": realm.color, "--t": realm.tint }}>
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
        <p>{realm.note}</p>
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
function MattersPage({ navigate, openModal }) {
  const [orderedMatters, setOrderedMatters] = useState(() => matters.filter((item) => item.state === "点亮"));
  const [draggedMatter, setDraggedMatter] = useState(null);
  const reorderMatter = (to) => {
    if (draggedMatter === null || draggedMatter === to) return;
    setOrderedMatters((current) => {
      const next = [...current], [moved] = next.splice(draggedMatter, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedMatter(null);
  };
  return (
    <div className="focus-page matters-focus-page">
      <Header title="事项与日常" openModal={openModal} navigate={navigate} />
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
        <button className="active">全部</button>
        {realms.map((r) => (
          <button key={r.name}>{r.name}</button>
        ))}
        <button className="outline push" onClick={() => openModal("addMatter")}>
          <Plus /> 添加事项
        </button>
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
            {orderedMatters.map((m) => {
              const index = matters.findIndex((item) => item.title === m.title && item.realm === m.realm);
              const r = realms.find((x) => x.name === m.realm),
                Icon = m.Icon;
              return (
                <article draggable onDragStart={(e) => { setDraggedMatter(orderedMatters.indexOf(m)); e.dataTransfer.effectAllowed = "move"; }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); reorderMatter(orderedMatters.indexOf(m)); }} onDragEnd={() => setDraggedMatter(null)}
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
          </div>
        </main>
        <aside className="life-aside">
          <section>
            <header>
              <h3>日常照顾</h3>
              <button onClick={() => openModal("addRoutine")}>
                <Plus />
              </button>
            </header>
            <button className="care-item">
              <span>
                <Heart />
              </span>
              <div>
                <b>喝水与舒展</b>
                <small>今天身体感觉如何？</small>
              </div>
            </button>
            <button className="care-item">
              <span>
                <Clock3 />
              </span>
              <div>
                <b>睡前离开屏幕</b>
                <small>给睡眠一点准备时间</small>
              </div>
            </button>
            <button className="care-item">
              <span>
                <BookOpen />
              </span>
              <div>
                <b>记录今天</b>
                <small>一句话也足够</small>
              </div>
            </button>
          </section>
          <section>
            <header>
              <h3>最近留下</h3>
              <button onClick={() => openModal("note")}>
                <Plus />
              </button>
            </header>
            <article className="life-note">
              <time>8月8日</time>
              <p>有些事情没有明显进展，但我和它的关系正在慢慢改变。</p>
            </article>
            <article className="life-note">
              <time>8月5日</time>
              <p>最近想把游泳重新放回生活里。</p>
            </article>
          </section>
        </aside>
      </div>
    </div>
  );
}
function TodoPage({ navigate, openModal, tasks, setTasks }) {
  const visibleTasks = tasks.filter((t) => !t.archived),
    arrangedTasks = visibleTasks.filter(
      (t) => !t.done && /\d{1,2}:\d{2}/.test(`${t.meta || ""} ${t.time || ""}`),
    );
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
          title="今天"
          sub="2026年8月10日"
          action={
            <button className="sort">
              按时间排序 <ChevronDown />
            </button>
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
            tasks={visibleTasks}
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
          <span className="profile-avatar">M</span>
          <div>
            <h2>May</h2>
            <p>登录后同步多端数据</p>
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
        <aside className="profile-quote">
          <Leaf />
          <div>
            <b>把生活整理成自己喜欢的样子。</b>
            <p>保持好奇，也允许每一种节奏自然发生。</p>
          </div>
          <i />
          <i />
        </aside>
      </div>
    </div>
  );
}
function ProfilePanel({ close, openModal, tasks = [] }) {
  const [view, setView] = useState("home"),
    [density, setDensity] = useState(savedAppearance.density),
    [theme, setTheme] = useState(savedAppearance.theme),
    [notifications, setNotifications] = useState({
      todo: true,
      review: true,
      sync: savedAppearance.followSystem,
    }),
    [feedback, setFeedback] = useState(""),
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
    archivedTasks = tasks.filter((t) => t.archived);
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
            <span>M</span>
            <div>
              <b>May</b>
              <small>登录后可在不同设备同步生活数据</small>
            </div>
            <button
              className="profile-login-button"
              onClick={() => openModal("login")}
            >
              <LogIn /> 登录并同步
            </button>
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
        <div className="space-summary">
          <article>
            <b>{activeTasks}</b>
            <span>正在推进</span>
          </article>
          <article>
            <b>{doneTasks}</b>
            <span>最近完成</span>
          </article>
          <article>
            <b>{realms.length}</b>
            <span>生活版图</span>
          </article>
        </div>
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
              {archivedTasks.length +
                matters.filter((m) => m.state === "结束").length}{" "}
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
            {matters.filter((m) => m.state === "结束").length ? (
              matters
                .filter((m) => m.state === "结束")
                .map((m) => (
                  <article key={m.title}>
                    <span>
                      <Archive />
                    </span>
                    <div>
                      <b>{m.title}</b>
                      <small>{m.realm} · 已结束</small>
                    </div>
                    <button>恢复</button>
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
          <button>
            <UserRound /> 游客状态
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
    [message, setMessage] = useState("");
  const submit = (e) => {
    e.preventDefault();
    setMessage(
      "登录界面已就绪，填入 Supabase 项目地址与公开密钥后即可启用真实同步。",
    );
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
          <button className="login-submit" type="submit">
            <LogIn />
            {mode === "login" ? "登录并开始同步" : "注册并开始同步"}
          </button>
        </form>
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
          <select value={repeat} onChange={(e) => setRepeat(e.target.value)}>
            <option value="">不重复</option>
            <option value="daily">每天</option>
            <option value="weekdays">每个工作日</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
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
  const [showEnded, setShowEnded] = useState(false);
  const Icon = realm.Icon,
    icons = [Video, Footprints, BookOpen, Sparkles],
    statusOptions = ["储备", "点亮", "结束"],
    statusIcons = [Archive, Sparkles, CheckCircle2];
  const [directions, setDirections] = useState(realm.directions),
    [statuses, setStatuses] = useState(() =>
      realm.directions.map(
        (title, i) =>
          matters.find((item) => item.title === title)?.state ||
          directionStates[i % 4],
      ),
    ),
    [subtitle, setSubtitle] = useState(
      realm.note ? [realm.note, "探索与成长"].filter(Boolean).join(" · ") : "",
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
        setTasks((tasks) =>
          tasks.map((task) =>
            task.tag === directions[i]
              ? { ...task, archived: next === "结束" }
              : task,
          ),
        );
        onDataChange?.();
        return next;
      }),
    );
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
    if (item) item.title = nextTitle;
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
        style={{ "--c": realm.color, "--t": realm.tint }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={close}>
          <X />
        </button>
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
              onChange={(e) => setSubtitle(e.target.value)}
              onBlur={saveSubtitle}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder=""
            />
          </div>
          <div className="header-summary">
            <article>
              <b>{statuses.filter((s) => s === "点亮").length}</b>
              <span>点亮</span>
            </article>
            <article>
              <b>{statuses.filter((s) => s === "储备").length}</b>
              <span>储备</span>
            </article>
            <article>
              <b>{statuses.filter((s) => s === "结束").length}</b>
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
            <button onClick={() => setAdding(true)}>
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
          <div className="modal-directions direction-profile-grid">
            {directions.map((d, i) => {
              const DIcon = iconForMatterName(d),
                StatusIcon = statusIcons[statusOptions.indexOf(statuses[i])];
              return (
                <article
                  className={selectedIndex === i ? "is-expanded" : ""}
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
                    className={`direction-profile-state status-${statusOptions.indexOf(statuses[i])}`}
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
                  <span>{realm.note}</span>
                  <footer>
                    <small>
                      最近更新 · {["今天", "2天前", "5天前", "1周前"][i % 4]}
                    </small>
                  </footer>
                </article>
              );
            })}
          </div>
          {statuses.includes("结束") && (
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
          {showEnded && (
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
  const defaultTodoTheme = { color: "#1769ff", tint: "#eff6ff" };
  const [title, setTitle] = useState(""),
    [tag, setTag] = useState(initialTag),
    [selectedRealmName, setSelectedRealmName] = useState(() =>
      initialTag
        ? realms.find((r) => r.directions.includes(initialTag))?.name || ""
        : "",
    ),
    [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA")),
    [time, setTime] = useState(""),
    [repeat, setRepeat] = useState(""),
    [note, setNote] = useState(""),
    [subtasks, setSubtasks] = useState([]),
    [subtaskDraft, setSubtaskDraft] = useState(""),
    [detailsOpen, setDetailsOpen] = useState(false);
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
          tag: tag || "收集箱",
          time: taskTime,
          level: "normal",
          date,
          clock: time,
          repeat,
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
        className="quick-todo-modal refined-quick-todo"
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
          <textarea
            autoFocus
            rows="3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="准备做什么？"
          />
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
          className={`quick-form-section ${detailsOpen ? "" : "quick-collapsed-details"}`}
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
                    {r.name} · {r.note}
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
              <select value={repeat} onChange={(e) => setRepeat(e.target.value)}>
                <option value="">不重复</option>
                <option value="daily">每天</option>
                <option value="weekdays">每个工作日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
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
        <button className="quick-save" disabled={!title.trim()} onClick={save}>
          <Check /> 保存待办
        </button>
      </section>
    </div>
  );
}

function InspirationMemo({ close, setTasks, onDataChange }) {
  const [draft, setDraft] = useState(""),
    [memos, setMemos] = useState(() => [...inspirationMemos]),
    [converting, setConverting] = useState([]);
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
              key={memo.id}
            >
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
function QuickSidebar({
  page,
  navigate,
  openModal,
  collapsed,
  setCollapsed,
  tasks,
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
              <b>{matters.filter((matter) => matter.realm === realm.name).length}</b>
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

function MobileNav({ page, navigate, openModal }) {
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
        className={page === "todo" ? "active" : ""}
        onClick={() => navigate("todo")}
      >
        <ListChecks />
        <span>待办</span>
      </button>
      <button
        className={page === "timeline" ? "active" : ""}
        onClick={() => navigate("timeline")}
      >
        <Clock3 />
        <span>时间轴</span>
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

function serializeCloudState(tasks) {
  return {
    version: 1,
    tasks,
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
}) {
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
    return <ProfilePanel close={close} openModal={openModal} tasks={tasks} />;
  if (modal === "login") return <LoginModal close={close} />;
  if (modal === "addRealm")
    return <NewRealmModal close={close} onCreated={refresh} />;
  if (modal === "addDirection")
    return <AddDirectionModal close={close} onCreated={refresh} />;
  if (modal?.startsWith("content-"))
    return (
      <ContentDetailModal
        item={matters[Number(modal.split("-")[1])]}
        tasks={tasks}
        setTasks={setTasks}
        openModal={openModal}
        close={close}
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
  const [page, setPage] = useState("today"),
    [modalStack, setModalStack] = useState([]),
    [closingLayers, setClosingLayers] = useState([]),
    [tasks, setTasks] = useState(initialTasks),
    [notificationReadIds, setNotificationReadIds] = useState([]),
    [sidebarCollapsed, setSidebarCollapsed] = useState(true),
    [realmVersion, setRealmVersion] = useState(0);
  const [cloudReady, setCloudReady] = useState(!isSupabaseConfigured);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    loadCloudSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        if (snapshot) {
          restoreCloudState(snapshot);
          if (Array.isArray(snapshot.tasks)) setTasks(snapshot.tasks);
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
        saveCloudSnapshot(serializeCloudState(tasks)).catch((error) =>
          console.warn("Supabase save skipped:", error.message),
        ),
      700,
    );
    return () => window.clearTimeout(timer);
  }, [tasks, realmVersion, cloudReady]);
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
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [openModal]);
  let content;
  if (page === "map")
    content = <MemoMapPage navigate={navigate} openModal={openModal} />;
  else if (page === "matters")
    content = <MemoMattersPage navigate={navigate} openModal={openModal} />;
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
    content = (
      <TimelinePage
        navigate={navigate}
        openModal={openModal}
        tasks={tasks}
        setTasks={setTasks}
      />
    );
  else if (page === "profile")
    content = <MemoProfilePage navigate={navigate} openModal={openModal} />;
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
      />
    );
  const refresh = () => setRealmVersion((v) => v + 1);
  return (
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
      />
      <main className="app">
        <div className="mobile-page-transition" key={page}>
          {content}
        </div>
        <MemoMobileNav page={page} navigate={navigate} openModal={openModal} />
      </main>
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
          />
        </div>
      ))}
    </div>
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
  const states = ["进行中", "待安排", "已结束"],
    status = task.done ? "已结束" : task.matterStatus || "进行中",
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
  nested = false,
}) {
  const realm = realms.find((r) => r.name === item.realm),
    Icon = item.Icon,
    linkedTasks = tasks.filter((task) => task.tag === item.title),
    currentTasks = linkedTasks.filter((task) => !task.done),
    activeTasks = currentTasks.filter((task) => task.matterStatus !== "待安排"),
    pendingTasks = currentTasks.filter(
      (task) => task.matterStatus === "待安排",
    ),
    completedTasks = linkedTasks.filter((task) => task.done);
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
          <div>
            <h2>{item.title}</h2>
            <p>
              {item.realm} · {realm.note}
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
                [...activeTasks, ...pendingTasks].map((task) => (
                  <MatterTaskCard
                    key={task.id}
                    task={task}
                    setTasks={setTasks}
                    openModal={openModal}
                  />
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
                    {r.name} · {r.note}
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
          <select value={repeat} onChange={(e) => setRepeat(e.target.value)}>
            <option value="">不重复</option>
            <option value="daily">每天</option>
            <option value="weekdays">每个工作日</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
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
function LinkedMatters({ openModal, tasks }) {
  const [orderedMatters, setOrderedMatters] = useState(() =>
      matters.filter((item) => item.state === "点亮"),
    ),
    [draggedIndex, setDraggedIndex] = useState(null);
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
  return (
    <div className="goals linked-goals all-linked-goals">
      {orderedMatters.map((item, index) => {
        const matterIndex = matters.findIndex(
          (entry) => entry.realm === item.realm && entry.title === item.title,
        );
        return (
          <div
            className="draggable-matter-card"
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
function AddDirectionModal({ close, onCreated }) {
  const [name, setName] = useState(""),
    [realmIndex, setRealmIndex] = useState(0),
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
                  <small>{r.note}</small>
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
