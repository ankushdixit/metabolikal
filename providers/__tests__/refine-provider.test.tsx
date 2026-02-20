import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Track the props passed to the Refine mock so we can assert on them
// ---------------------------------------------------------------------------

interface CapturedRefineProps {
  dataProvider?: Record<string, unknown>;
  authProvider?: Record<string, unknown>;
  routerProvider?: unknown;
  resources?: Array<{ name: string }>;
  options?: {
    syncWithLocation?: boolean;
    warnWhenUnsavedChanges?: boolean;
    useNewQueryKeys?: boolean;
    projectId?: string;
    reactQuery?: {
      clientConfig?: {
        defaultOptions?: {
          queries?: {
            staleTime?: number;
            gcTime?: number;
            refetchOnWindowFocus?: boolean;
            retry?: number;
          };
        };
      };
    };
  };
}

let capturedProps: CapturedRefineProps = {};

// Mock @refinedev/core Refine component
jest.mock("@refinedev/core", () => ({
  Refine: (props: CapturedRefineProps & { children?: React.ReactNode }) => {
    capturedProps = props;
    return (
      <div data-testid="refine-mock">
        {props.children}
        <div data-testid="refine-props">
          {JSON.stringify({
            hasDataProvider: !!props.dataProvider,
            hasAuthProvider: !!props.authProvider,
            hasRouterProvider: !!props.routerProvider,
            resourceCount: props.resources?.length,
            hasOptions: !!props.options,
          })}
        </div>
      </div>
    );
  },
}));

// Mock refine config — returns a real data provider by default
jest.mock("@/lib/refine", () => ({
  refineDataProvider: {
    getList: jest.fn(),
    getOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteOne: jest.fn(),
    getApiUrl: jest.fn(),
  },
  refineAuthProvider: { login: jest.fn(), check: jest.fn() },
  refineRouterProvider: { routerType: "nextjs" },
  refineResources: [
    { name: "calculator_settings", list: "/admin/config/calculator-settings" },
    { name: "plan_templates", list: "/admin/config/templates" },
    { name: "template_diet_items" },
    { name: "template_supplement_items" },
    { name: "template_workout_items" },
    { name: "template_lifestyle_items" },
  ],
  refineOptions: {
    syncWithLocation: true,
    warnWhenUnsavedChanges: true,
    useNewQueryKeys: true,
    projectId: "refine-dashboard",
  },
}));

import { RefineProvider } from "../refine-provider";

// ==========================================================================
// Tests: with real data provider
// ==========================================================================

describe("RefineProvider Component — with data provider", () => {
  beforeEach(() => {
    capturedProps = {};
  });

  it("renders children inside Refine", () => {
    render(
      <RefineProvider>
        <div>Hello Child</div>
      </RefineProvider>
    );
    expect(screen.getByText("Hello Child")).toBeInTheDocument();
  });

  it("wraps children with Refine component", () => {
    render(
      <RefineProvider>
        <div>Child</div>
      </RefineProvider>
    );
    expect(screen.getByTestId("refine-mock")).toBeInTheDocument();
  });

  it("passes the configured data provider to Refine", () => {
    render(
      <RefineProvider>
        <div>Child</div>
      </RefineProvider>
    );
    const props = JSON.parse(screen.getByTestId("refine-props").textContent || "{}");
    expect(props.hasDataProvider).toBe(true);

    // Verify it has the shape of a real Supabase data provider
    expect(capturedProps.dataProvider).toHaveProperty("getList");
    expect(capturedProps.dataProvider).toHaveProperty("getOne");
    expect(capturedProps.dataProvider).toHaveProperty("create");
    expect(capturedProps.dataProvider).toHaveProperty("update");
    expect(capturedProps.dataProvider).toHaveProperty("deleteOne");
    expect(capturedProps.dataProvider).toHaveProperty("getApiUrl");
  });

  it("passes authProvider to Refine", () => {
    render(
      <RefineProvider>
        <div>Child</div>
      </RefineProvider>
    );
    expect(capturedProps.authProvider).toBeDefined();
    expect(capturedProps.authProvider).toHaveProperty("login");
    expect(capturedProps.authProvider).toHaveProperty("check");
  });

  it("passes routerProvider to Refine", () => {
    render(
      <RefineProvider>
        <div>Child</div>
      </RefineProvider>
    );
    const props = JSON.parse(screen.getByTestId("refine-props").textContent || "{}");
    expect(props.hasRouterProvider).toBe(true);
  });

  it("passes resources to Refine", () => {
    render(
      <RefineProvider>
        <div>Child</div>
      </RefineProvider>
    );
    const props = JSON.parse(screen.getByTestId("refine-props").textContent || "{}");
    // The mock provides 6 resources matching the real module
    expect(props.resourceCount).toBe(6);
    expect(capturedProps.resources?.map((r) => r.name)).toEqual([
      "calculator_settings",
      "plan_templates",
      "template_diet_items",
      "template_supplement_items",
      "template_workout_items",
      "template_lifestyle_items",
    ]);
  });

  it("passes options to Refine", () => {
    render(
      <RefineProvider>
        <div>Child</div>
      </RefineProvider>
    );
    const props = JSON.parse(screen.getByTestId("refine-props").textContent || "{}");
    expect(props.hasOptions).toBe(true);
  });

  it("merges refineOptions with reactQuery config", () => {
    render(
      <RefineProvider>
        <div>Child</div>
      </RefineProvider>
    );

    const options = capturedProps.options;
    expect(options).toBeDefined();

    // Original refineOptions are spread
    expect(options?.syncWithLocation).toBe(true);
    expect(options?.warnWhenUnsavedChanges).toBe(true);
    expect(options?.useNewQueryKeys).toBe(true);
    expect(options?.projectId).toBe("refine-dashboard");

    // React Query defaults are appended
    const queryDefaults = options?.reactQuery?.clientConfig?.defaultOptions?.queries;
    expect(queryDefaults).toBeDefined();
    expect(queryDefaults?.staleTime).toBe(2 * 60 * 1000); // 2 minutes
    expect(queryDefaults?.gcTime).toBe(5 * 60 * 1000); // 5 minutes
    expect(queryDefaults?.refetchOnWindowFocus).toBe(false);
    expect(queryDefaults?.retry).toBe(1);
  });

  it("renders multiple children", () => {
    render(
      <RefineProvider>
        <div>First</div>
        <div>Second</div>
      </RefineProvider>
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("renders Refine wrapper", () => {
    render(
      <RefineProvider>
        <div>Child</div>
      </RefineProvider>
    );
    expect(screen.getByTestId("refine-mock")).toBeInTheDocument();
  });
});

// ==========================================================================
// Tests: null data provider uses placeholder fallback
// ==========================================================================

describe("RefineProvider Component — with null data provider (placeholder fallback)", () => {
  // We need to test with refineDataProvider = null. Since jest.mock is hoisted
  // and only one mock per module is possible, we use jest.resetModules + require
  // to re-import with a different mock configuration.

  let RefineProviderNull: typeof RefineProvider;

  beforeAll(() => {
    jest.resetModules();

    // Re-register the Refine mock (since resetModules cleared it)
    jest.mock("@refinedev/core", () => ({
      Refine: (props: CapturedRefineProps & { children?: React.ReactNode }) => {
        capturedProps = props;
        return (
          <div data-testid="refine-mock">
            {props.children}
            <div data-testid="refine-props">
              {JSON.stringify({
                hasDataProvider: !!props.dataProvider,
                hasAuthProvider: !!props.authProvider,
                hasRouterProvider: !!props.routerProvider,
                resourceCount: props.resources?.length,
                hasOptions: !!props.options,
              })}
            </div>
          </div>
        );
      },
    }));

    // Mock with null data provider
    jest.mock("@/lib/refine", () => ({
      refineDataProvider: null,
      refineAuthProvider: { login: jest.fn(), check: jest.fn() },
      refineRouterProvider: {},
      refineResources: [],
      refineOptions: { syncWithLocation: true },
    }));

    RefineProviderNull = require("../refine-provider").RefineProvider;
  });

  beforeEach(() => {
    capturedProps = {};
  });

  it("renders children even with null data provider", () => {
    render(
      <RefineProviderNull>
        <div>Still works</div>
      </RefineProviderNull>
    );
    expect(screen.getByText("Still works")).toBeInTheDocument();
  });

  it("uses placeholder data provider when refineDataProvider is null", () => {
    render(
      <RefineProviderNull>
        <div>Child</div>
      </RefineProviderNull>
    );

    // Refine should still receive a dataProvider (the placeholder)
    const props = JSON.parse(screen.getByTestId("refine-props").textContent || "{}");
    expect(props.hasDataProvider).toBe(true);

    // The placeholder has the same shape as a data provider
    expect(capturedProps.dataProvider).toBeDefined();
    expect(capturedProps.dataProvider).toHaveProperty("getList");
    expect(capturedProps.dataProvider).toHaveProperty("getOne");
    expect(capturedProps.dataProvider).toHaveProperty("create");
    expect(capturedProps.dataProvider).toHaveProperty("update");
    expect(capturedProps.dataProvider).toHaveProperty("deleteOne");
    expect(capturedProps.dataProvider).toHaveProperty("getApiUrl");
  });

  it("placeholder getList throws descriptive error", async () => {
    render(
      <RefineProviderNull>
        <div>Child</div>
      </RefineProviderNull>
    );

    const dp = capturedProps.dataProvider as {
      getList: (params: { resource: string }) => Promise<unknown>;
    };
    await expect(dp.getList({ resource: "users" })).rejects.toThrow(/Supabase not configured/);
    await expect(dp.getList({ resource: "users" })).rejects.toThrow(/users/);
  });

  it("placeholder getOne throws descriptive error with resource and id", async () => {
    render(
      <RefineProviderNull>
        <div>Child</div>
      </RefineProviderNull>
    );

    const dp = capturedProps.dataProvider as {
      getOne: (params: { resource: string; id: string }) => Promise<unknown>;
    };
    await expect(dp.getOne({ resource: "products", id: "42" })).rejects.toThrow(
      /Supabase not configured/
    );
    await expect(dp.getOne({ resource: "products", id: "42" })).rejects.toThrow(/products/);
  });

  it("placeholder create throws descriptive error", async () => {
    render(
      <RefineProviderNull>
        <div>Child</div>
      </RefineProviderNull>
    );

    const dp = capturedProps.dataProvider as {
      create: (params: { resource: string }) => Promise<unknown>;
    };
    await expect(dp.create({ resource: "orders" })).rejects.toThrow(/Supabase not configured/);
  });

  it("placeholder update throws descriptive error", async () => {
    render(
      <RefineProviderNull>
        <div>Child</div>
      </RefineProviderNull>
    );

    const dp = capturedProps.dataProvider as {
      update: (params: { resource: string; id: string }) => Promise<unknown>;
    };
    await expect(dp.update({ resource: "items", id: "99" })).rejects.toThrow(
      /Supabase not configured/
    );
  });

  it("placeholder deleteOne throws descriptive error", async () => {
    render(
      <RefineProviderNull>
        <div>Child</div>
      </RefineProviderNull>
    );

    const dp = capturedProps.dataProvider as {
      deleteOne: (params: { resource: string; id: string }) => Promise<unknown>;
    };
    await expect(dp.deleteOne({ resource: "records", id: "1" })).rejects.toThrow(
      /Supabase not configured/
    );
  });

  it("placeholder getApiUrl returns empty string", () => {
    render(
      <RefineProviderNull>
        <div>Child</div>
      </RefineProviderNull>
    );

    const dp = capturedProps.dataProvider as {
      getApiUrl: () => string;
    };
    expect(dp.getApiUrl()).toBe("");
  });

  it("still passes options with reactQuery config even with null data provider", () => {
    render(
      <RefineProviderNull>
        <div>Child</div>
      </RefineProviderNull>
    );

    const options = capturedProps.options;
    expect(options).toBeDefined();

    // syncWithLocation from the mock
    expect(options?.syncWithLocation).toBe(true);

    // React Query defaults still added
    const queryDefaults = options?.reactQuery?.clientConfig?.defaultOptions?.queries;
    expect(queryDefaults).toBeDefined();
    expect(queryDefaults?.staleTime).toBe(2 * 60 * 1000);
    expect(queryDefaults?.gcTime).toBe(5 * 60 * 1000);
    expect(queryDefaults?.refetchOnWindowFocus).toBe(false);
    expect(queryDefaults?.retry).toBe(1);
  });
});
