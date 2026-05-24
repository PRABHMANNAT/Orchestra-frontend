import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useParams } from "react-router-dom";

export type PageContext =
  | "dashboard"
  | "brain"
  | "flowchart"
  | "memory"
  | "live-doc"
  | "requests"
  | "project-overview";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "diagram" | "citation";
  diagram?: {
    kind: "dependency" | "flowchart" | "sequence" | "usecase";
    mermaid: string;
    stats?: { label: string; value: string | number; color: string }[];
  };
  citations?: {
    source: string;
    excerpt: string;
    anchor: string;
  }[];
  timestamp: Date;
};

type DiagramKind = NonNullable<Message["diagram"]>["kind"];

type SocratesContextType = {
  messages: Message[];
  isStreaming: boolean;
  pageContext: PageContext;
  projectId: string | null;
  suggestions: string[];
  sendMessage: (content: string) => Promise<void>;
  setPageContext: (ctx: PageContext) => void;
};

const PAGE_SUGGESTIONS: Record<PageContext, string[]> = {
  dashboard: ["What's due this week?", "Any pending requests?", "Today's meetings?"],
  brain: ["Explain the core product flows", "Which areas are still unresolved?", "What changed most recently?"],
  flowchart: ["What are the critical paths?", "Which nodes have the most risk?", "Generate a dependency map"],
  memory: ["Find all decisions about auth", "What did the client say about payments?", "Show changes from last week"],
  "live-doc": ["Export agent context", "Show payments context", "Generate a system diagram"],
  requests: ["Which requests are blocking?", "Summarize pending changes", "What needs approval today?"],
  "project-overview": ["How is Northstar tracking?", "Who is overloaded?", "What's the next critical deadline?"]
};

const PROJECT_NAMES: Record<string, string> = {
  "1": "Northstar Cloud",
  "2": "Elara Games",
  "3": "API Gateway"
};

let persistedMessages: Message[] = [];
let persistedPageContext: PageContext = "dashboard";
let persistedProjectId: string | null = null;

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `msg_${Math.random().toString(36).slice(2, 10)}`;
}

function includesAny(content: string, terms: string[]) {
  return terms.some((term) => content.includes(term));
}

function resolvePageContext(pathname: string): PageContext {
  if (pathname === "/dashboard") {
    return "dashboard";
  }

  if (pathname.includes("/brain")) {
    return "brain";
  }

  if (pathname.includes("/flow")) {
    return "flowchart";
  }

  if (pathname.includes("/memory") || pathname.includes("/docs/")) {
    return "memory";
  }

  if (pathname.includes("/live-doc")) {
    return "live-doc";
  }

  if (pathname.includes("/requests")) {
    return "requests";
  }

  return "project-overview";
}

function getProjectName(projectId: string | null) {
  if (!projectId) {
    return "Portfolio";
  }

  return PROJECT_NAMES[projectId] ?? "Northstar Cloud";
}

function buildDependencyDiagram(projectName: string) {
  return `graph LR
  Brief([${projectName} Brief]) --> DAG([Brain DAG])
  DAG --> Build([Build Scope])
  Messages([Client Messages]) -.-> Changes([Accepted Changes])
  Changes -.-> Decisions([Decisions])
  DAG --> Changes
  
  style Brief fill:#E9EFEC,stroke:#B8543D,color:#1A1612
  style DAG fill:#E9EFEC,stroke:#B8543D,color:#1A1612
  style Build fill:#EFEEEC,stroke:#5A5450,color:#1A1612
  style Messages fill:#EFEEEC,stroke:#5A5450,color:#1A1612
  style Changes fill:#F3E8D9,stroke:#B8543D,color:#1A1612
  style Decisions fill:#EFEEEC,stroke:#5A5450,color:#1A1612`;
}

function buildFlowchartDiagram(projectName: string) {
  return `flowchart TD
  A([${projectName} Order Placed]) --> B{Payment OK?}
  B -->|Yes| C[Create Order]
  B -->|No| D[/Notify Buyer/]
  C --> E{Billing Worker Available?}
  E -->|Yes| F[Assign Billing Worker]
  E -->|No| G[Queue Order]
  F --> H{Manager Approval?}
  H -->|Yes| I[Dispatch]
  H -->|No| G
  I --> J([Delivered])
  
  style A fill:#E9EFEC,stroke:#B8543D,color:#1A1612
  style J fill:#E9EFEC,stroke:#B8543D,color:#1A1612
  style B fill:#F3E8D9,stroke:#B8543D,color:#1A1612
  style E fill:#F3E8D9,stroke:#B8543D,color:#1A1612
  style H fill:#F3E8D9,stroke:#B8543D,color:#1A1612`;
}

function buildSequenceDiagram(projectName: string) {
  return `sequenceDiagram
  autonumber
  actor Buyer
  participant API as API Gateway
  participant Orders as Order Service
  participant Billing Worker as Billing Worker Assignment
  participant Ops as Admin Panel
  
  Buyer->>API: Create ${projectName} order
  API->>Orders: Validate payload
  Orders->>Billing Worker: Request availability
  Billing Worker-->>Orders: Billing Worker candidate found
  Orders->>Ops: Request manager approval
  Ops-->>Orders: Approved
  Orders-->>Buyer: Dispatch confirmed`;
}

function buildUseCaseDiagram(projectName: string) {
  return `graph LR
  Buyer([Buyer])
  Manager([Manager])
  Billing Worker([Billing Worker])
  
  subgraph ${projectName}
    Search[Browse & Search]
    Checkout[Checkout]
    Assign[Assign Billing Worker]
    Approve[Approve Dispatch]
    Track[Track Billing]
  end
  
  Buyer --> Search
  Buyer --> Checkout
  Buyer --> Track
  Manager --> Approve
  Billing Worker --> Assign
  
  style Checkout fill:#E9EFEC,stroke:#B8543D,color:#1A1612
  style Approve fill:#F3E8D9,stroke:#B8543D,color:#1A1612
  style Assign fill:#EFEEEC,stroke:#5A5450,color:#1A1612`;
}

function pickTextResponse(pageContext: PageContext, content: string, projectName: string) {
  const responses: Record<PageContext, string[]> = {
    dashboard: [
      `You have **3 deadlines this week**: BillingPort verification (3 days), Tenant Boundary Handoff (5 days), and Dashboard v2 Billing (11 days). ${projectName === "Portfolio" ? "Northstar Cloud" : projectName} has the most urgent items.`,
      `**2 pending requests** need your attention: Sarah from Northstar wants billing export review, and Elena from Elara Games is requesting dark mode support.`,
      `You have **3 meetings today**: Northstar Billing Review at 9:00 AM, API Gateway Review at 11:30 AM, and Client Sync · Elara at 2:00 PM.`
    ],
    brain: [
      `${projectName} has **8 sources** indexed. The core flows are: SDK emit → ingestion → ledger → invoice preview. Two nodes need review: replay dashboard and webhook retries.`,
      `**Recent changes**: PR #418 isolated Stripe behind BillingPort, entitlement checks moved behind ledger reconciliation, and stale CSV-only invoice notes were dropped.`,
      `**Unresolved areas**: Usage replay dashboard owner and webhook retry alert thresholds still need confirmation before the May 29 release gate.`
    ],
    flowchart: [
      `The critical path runs through **SDK emit → Ingestion → Ledger → Invoice Preview**. Ledger reconciliation is highest risk because it gates entitlement unlock.`,
      `**3 nodes are at risk**: Usage replay, webhook retry dashboard, and invoice preview verification.`,
      `The most connected node is **Ledger**. It feeds invoice preview, entitlements, audit export, and beta readiness.`
    ],
    memory: [
      `Found **4 sources** mentioning tenancy. Current truth: row-level tenant boundary checks run before entitlement checks.`,
      `Payments context has **3 load-bearing decisions**: Stripe behind BillingPort, ledger reconciliation gates entitlements, and invoice preview reads ledger state only.`,
      `**Last week's changes**: PR #418 merged BillingPort, direct-Stripe preview was superseded, and stale CSV-only review notes were removed from exports.`
    ],
    "live-doc": [
      `This context layer has **7 curated claims** and each claim links to source evidence. Stale direct-Stripe notes are auditable but excluded from exports.`,
      `**Since PR #418**: Stripe is isolated behind BillingPort, invoice preview reads ledger state, and backend/payments/agent exports regenerate from that truth.`,
      `The system diagram shows **SDK emit → ingestion → ledger → invoice preview / entitlements**. The highest-risk edge is reconciliation before entitlement unlock.`
    ],
    requests: [
      `**2 requests are pending**: Billing export review for Northstar Cloud and Dark mode support for Elara Games. Both need review before they can become accepted changes.`,
      `The billing export review would affect **3 brain nodes**: BillingPort, Ledger, and Agent Context Export.`,
      `**4 requests total**: 2 accepted and 2 pending. Accepted requests are already reflected in the Live Doc.`
    ],
    "project-overview": [
      `${projectName} is **34% complete** with a Jun 2026 deadline. Current status is HEALTHY. Sprint 2 of 8 is active and spend is tracking inside budget.`,
      `**Team load**: SC is managing overall, MT owns BillingPort, PK owns tenant checks, and JW owns the billing surface. No one is currently flagged as overloaded.`,
      `**Next critical deadline**: Billing context export is due May 29. Marcus T and Priya K are assigned. PR #418 changed the backend contract last week.`
    ]
  };

  const options = responses[pageContext];

  if (pageContext === "dashboard") {
    if (includesAny(content, ["due", "deadline", "week"])) {
      return options[0];
    }

    if (includesAny(content, ["request", "pending", "approval"])) {
      return options[1];
    }

    if (includesAny(content, ["meeting", "today", "calendar"])) {
      return options[2];
    }
  }

  if (pageContext === "brain") {
    if (includesAny(content, ["flow", "core", "explain"])) {
      return options[0];
    }

    if (includesAny(content, ["change", "recent"])) {
      return options[1];
    }

    if (includesAny(content, ["unresolved", "risk"])) {
      return options[2];
    }
  }

  if (pageContext === "flowchart") {
    if (includesAny(content, ["critical", "path"])) {
      return options[0];
    }

    if (includesAny(content, ["risk", "risky"])) {
      return options[1];
    }

    if (includesAny(content, ["connected", "dependency"])) {
      return options[2];
    }
  }

  if (pageContext === "memory") {
    if (includesAny(content, ["auth", "authentication"])) {
      return options[0];
    }

    if (includesAny(content, ["payment", "payments"])) {
      return options[1];
    }

    if (includesAny(content, ["last week", "changes"])) {
      return options[2];
    }
  }

  if (pageContext === "live-doc") {
    if (includesAny(content, ["summarize", "summary", "document"])) {
      return options[0];
    }

    if (includesAny(content, ["v1", "changed", "since"])) {
      return options[1];
    }

    if (includesAny(content, ["diagram", "system"])) {
      return options[2];
    }
  }

  if (pageContext === "requests") {
    if (includesAny(content, ["block", "blocking"])) {
      return options[0];
    }

    if (includesAny(content, ["summarize", "summary", "pending"])) {
      return options[1];
    }

    if (includesAny(content, ["approval", "today"])) {
      return options[2];
    }
  }

  if (pageContext === "project-overview") {
    if (includesAny(content, ["tracking", "status", projectName.toLowerCase()])) {
      return options[0];
    }

    if (includesAny(content, ["overloaded", "load", "team"])) {
      return options[1];
    }

    if (includesAny(content, ["deadline", "critical", "next"])) {
      return options[2];
    }
  }

  return options[0];
}

export const SocratesContext = createContext<SocratesContextType | null>(null);

export function SocratesProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const [messages, setMessages] = useState<Message[]>(persistedMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pageContext, setPageContextState] = useState<PageContext>(persistedPageContext);
  const [projectId, setProjectId] = useState<string | null>(persistedProjectId);

  const derivedPageContext = useMemo(() => resolvePageContext(location.pathname), [location.pathname]);

  useEffect(() => {
    setPageContextState(derivedPageContext);
  }, [derivedPageContext]);

  useEffect(() => {
    setProjectId(id ?? null);
  }, [id]);

  useEffect(() => {
    persistedMessages = messages;
  }, [messages]);

  useEffect(() => {
    persistedPageContext = pageContext;
  }, [pageContext]);

  useEffect(() => {
    persistedProjectId = projectId;
  }, [projectId]);

  const suggestions = PAGE_SUGGESTIONS[pageContext];

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();

      if (!trimmed || isStreaming) {
        return;
      }

      const userMessage: Message = {
        id: createId(),
        role: "user",
        content: trimmed,
        type: "text",
        timestamp: new Date()
      };

      setMessages((currentMessages) => [...currentMessages, userMessage]);
      setIsStreaming(true);

      const lowerContent = trimmed.toLowerCase();
      const projectName = getProjectName(projectId);
      const isDiagramRequest = includesAny(lowerContent, ["diagram", "flowchart", "dependency", "map", "sequence", "use case", "usecase"]);
      const isDependencyMap = includesAny(lowerContent, ["dependency", "map"]);
      const isSequenceDiagram = lowerContent.includes("sequence");
      const isUseCaseDiagram = includesAny(lowerContent, ["use case", "usecase"]);

      await delay(800);

      let response: Message;

      if (isDiagramRequest) {
        let kind: DiagramKind = "flowchart";
        let mermaid = buildFlowchartDiagram(projectName);
        let contentPrefix = `Generated from the current ${pageContext.replace("-", " ")} context for ${projectName}.`;

        if (isDependencyMap) {
          kind = "dependency";
          mermaid = buildDependencyDiagram(projectName);
          contentPrefix = `Here's the live dependency map for ${projectName}. I found 2 unresolved nodes and 3 critical paths.`;
        } else if (isSequenceDiagram) {
          kind = "sequence";
          mermaid = buildSequenceDiagram(projectName);
          contentPrefix = `Generated the latest interaction sequence for ${projectName} based on the current project state.`;
        } else if (isUseCaseDiagram) {
          kind = "usecase";
          mermaid = buildUseCaseDiagram(projectName);
          contentPrefix = `Generated a use case view for ${projectName} from the current project context.`;
        }

        response = {
          id: createId(),
          role: "assistant",
          content: contentPrefix,
          type: "diagram",
          diagram: {
            kind,
            mermaid,
            stats:
              kind === "dependency"
                ? [
                    { label: "Critical", value: 4, color: "#9E3B2E" },
                    { label: "Risky", value: 3, color: "#B8543D" },
                    { label: "Changes", value: 2, color: "#5A5450" }
                  ]
                : undefined
          },
          timestamp: new Date()
        };
      } else {
        const citations = includesAny(lowerContent, ["where", "source"])
          ? [
              {
                source: `${projectName} context layer · BillingPort decision`,
                excerpt: "Stripe remains isolated behind BillingPort; invoice preview reads ledger state only.",
                anchor: "catalog-body"
              }
            ]
          : undefined;

        response = {
          id: createId(),
          role: "assistant",
          content: pickTextResponse(pageContext, lowerContent, projectName),
          type: citations ? "citation" : "text",
          citations,
          timestamp: new Date()
        };
      }

      setMessages((currentMessages) => [...currentMessages, { ...response, content: "" }]);

      const words = response.content.split(" ");
      for (let index = 0; index < words.length; index += 1) {
        await delay(30);
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === response.id ? { ...message, content: words.slice(0, index + 1).join(" ") } : message
          )
        );
      }

      if (response.diagram || response.citations) {
        setMessages((currentMessages) => currentMessages.map((message) => (message.id === response.id ? response : message)));
      }

      setIsStreaming(false);
    },
    [isStreaming, pageContext, projectId]
  );

  return (
    <SocratesContext.Provider
      value={{
        messages,
        isStreaming,
        pageContext,
        projectId,
        suggestions,
        sendMessage,
        setPageContext: setPageContextState
      }}
    >
      {children}
    </SocratesContext.Provider>
  );
}

export function useSocrates() {
  const context = useContext(SocratesContext);

  if (!context) {
    throw new Error("useSocrates must be used within SocratesProvider");
  }

  return context;
}
