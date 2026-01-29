# Plan Templates Feature - Implementation Plan

> **Status**: Planning
> **Created**: 2026-01-28
> **Scope**: Single-day templates with category support and condition compatibility warnings

---

## 1. Feature Overview

### Goal

Allow admins to create reusable single-day plan templates that can be applied to any day in a client's plan, significantly reducing repetitive work.

### User Flow

**Creating a Template:**

1. Admin navigates to Configuration → Templates
2. Clicks "Create Template"
3. Enters template name, description (optional), category
4. Uses familiar timeline editor UI to add items
5. Saves template

**Applying a Template:**

1. Admin is in Plan Editor for a client
2. Clicks "Apply Template" button
3. Modal shows available templates (filterable by category)
4. Selects a template → items are added to current day
5. If client has medical conditions, incompatible items show warning badge
6. Admin can then modify items as needed
7. Uses existing "Copy Day" to propagate to other days

---

## 2. Database Schema

### New Tables

```sql
-- Migration: create_plan_templates_tables.sql

-- 1. Main templates table
CREATE TABLE plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Index for listing and filtering
CREATE INDEX idx_plan_templates_category ON plan_templates(category);
CREATE INDEX idx_plan_templates_is_active ON plan_templates(is_active);

-- 2. Template diet items (mirrors diet_plans structure, no client_id/day_number)
CREATE TABLE template_diet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES plan_templates(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  meal_category VARCHAR(50),
  serving_multiplier DECIMAL(4,2) DEFAULT 1.0,
  time_type VARCHAR(20) DEFAULT 'fixed',
  time_start TIME,
  time_end TIME,
  time_period VARCHAR(30),
  relative_anchor VARCHAR(50),
  relative_offset_minutes INTEGER,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_template_diet_items_template ON template_diet_items(template_id);

-- 3. Template supplement items
CREATE TABLE template_supplement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES plan_templates(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  dosage DECIMAL(10,2),
  time_type VARCHAR(20) DEFAULT 'fixed',
  time_start TIME,
  time_end TIME,
  time_period VARCHAR(30),
  relative_anchor VARCHAR(50),
  relative_offset_minutes INTEGER,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_template_supplement_items_template ON template_supplement_items(template_id);

-- 4. Template workout items
CREATE TABLE template_workout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES plan_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255),
  section VARCHAR(50) DEFAULT 'main',
  sets INTEGER,
  reps INTEGER,
  duration_minutes INTEGER,
  scheduled_duration_minutes INTEGER,
  rest_seconds INTEGER,
  time_type VARCHAR(20) DEFAULT 'fixed',
  time_start TIME,
  time_end TIME,
  time_period VARCHAR(30),
  relative_anchor VARCHAR(50),
  relative_offset_minutes INTEGER,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_template_workout_items_template ON template_workout_items(template_id);

-- 5. Template lifestyle items
CREATE TABLE template_lifestyle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES plan_templates(id) ON DELETE CASCADE,
  lifestyle_activity_type_id UUID NOT NULL REFERENCES lifestyle_activity_types(id) ON DELETE CASCADE,
  target_value DECIMAL(10,2),
  time_type VARCHAR(20) DEFAULT 'fixed',
  time_start TIME,
  time_end TIME,
  time_period VARCHAR(30),
  relative_anchor VARCHAR(50),
  relative_offset_minutes INTEGER,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_template_lifestyle_items_template ON template_lifestyle_items(template_id);

-- RLS Policies (admin only)
ALTER TABLE plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_diet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_supplement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_workout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_lifestyle_items ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage templates" ON plan_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage template diet items" ON template_diet_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage template supplement items" ON template_supplement_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage template workout items" ON template_workout_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage template lifestyle items" ON template_lifestyle_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### Suggested Categories (can be configured)

- `weight_loss` - Weight Loss
- `maintenance` - Maintenance
- `muscle_gain` - Muscle Gain
- `reset` - Reset/Detox
- `rest_day` - Rest Day
- `training_day` - Training Day
- `general` - General

---

## 3. TypeScript Types

### New Types (add to `lib/database.types.ts`)

```typescript
// Plan Template
export interface PlanTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Template Diet Item
export interface TemplateDietItem {
  id: string;
  template_id: string;
  food_item_id: string;
  meal_category: string | null;
  serving_multiplier: number;
  time_type: TimeType;
  time_start: string | null;
  time_end: string | null;
  time_period: TimePeriod | null;
  relative_anchor: RelativeAnchor | null;
  relative_offset_minutes: number | null;
  notes: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Template Supplement Item
export interface TemplateSupplementItem {
  id: string;
  template_id: string;
  supplement_id: string;
  dosage: number | null;
  time_type: TimeType;
  time_start: string | null;
  time_end: string | null;
  time_period: TimePeriod | null;
  relative_anchor: RelativeAnchor | null;
  relative_offset_minutes: number | null;
  notes: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Template Workout Item
export interface TemplateWorkoutItem {
  id: string;
  template_id: string;
  exercise_id: string;
  exercise_name: string | null;
  section: "warmup" | "main" | "cooldown";
  sets: number | null;
  reps: number | null;
  duration_minutes: number | null;
  scheduled_duration_minutes: number | null;
  rest_seconds: number | null;
  time_type: TimeType;
  time_start: string | null;
  time_end: string | null;
  time_period: TimePeriod | null;
  relative_anchor: RelativeAnchor | null;
  relative_offset_minutes: number | null;
  notes: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Template Lifestyle Item
export interface TemplateLifestyleItem {
  id: string;
  template_id: string;
  lifestyle_activity_type_id: string;
  target_value: number | null;
  time_type: TimeType;
  time_start: string | null;
  time_end: string | null;
  time_period: TimePeriod | null;
  relative_anchor: RelativeAnchor | null;
  relative_offset_minutes: number | null;
  notes: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// With relations (for display)
export interface TemplateDietItemWithFood extends TemplateDietItem {
  food_items: FoodItem | null;
}

export interface TemplateSupplementItemWithSupplement extends TemplateSupplementItem {
  supplements: Supplement | null;
}

export interface TemplateWorkoutItemWithExercise extends TemplateWorkoutItem {
  exercises: Exercise | null;
}

export interface TemplateLifestyleItemWithType extends TemplateLifestyleItem {
  lifestyle_activity_types: LifestyleActivityType | null;
}

// Template with item counts (for list view)
export interface PlanTemplateWithCounts extends PlanTemplate {
  diet_count: number;
  supplement_count: number;
  workout_count: number;
  lifestyle_count: number;
}
```

---

## 4. File Structure

### New Files to Create

```
app/admin/config/templates/
├── page.tsx                    # Templates list page
├── create/
│   └── page.tsx               # Create template page
└── [id]/
    └── edit/
        └── page.tsx           # Edit template page

components/admin/templates/
├── template-list.tsx          # Template list with filtering
├── template-card.tsx          # Card for template in list
├── template-editor.tsx        # Main editor (reuses timeline components)
├── template-form-header.tsx   # Name, description, category form
└── apply-template-modal.tsx   # Modal for applying template to client day

hooks/
└── use-template-data.ts       # Data hook for template items (similar to use-timeline-data)
```

### Files to Modify

```
components/admin/timeline-editor/
├── meal-item-form.tsx         # Add templateId prop support
├── supplement-item-form.tsx   # Add templateId prop support
├── workout-item-form.tsx      # Add templateId prop support
├── lifestyle-item-form.tsx    # Add templateId prop support
├── grouped-meal-modal.tsx     # Add templateId prop support
├── grouped-supplement-modal.tsx
├── grouped-workout-modal.tsx
├── grouped-lifestyle-modal.tsx
└── timeline-item.tsx          # Add condition warning indicator

components/admin/
└── admin-sidebar.tsx          # Add Templates nav item under Configuration

app/admin/clients/[id]/plans/
└── page.tsx                   # Add "Apply Template" button and modal

lib/
├── refine.tsx                 # Add template resources
└── database.types.ts          # Add template types
```

---

## 5. Component Reuse Strategy

### Components to Reuse As-Is

| Component        | Usage in Templates                 |
| ---------------- | ---------------------------------- |
| `TimelineGrid`   | Display template items on timeline |
| `TimelineItem`   | Render individual items            |
| `AddItemModal`   | Select item type to add            |
| `TimingSelector` | Schedule item timing               |

### Components to Modify (Add `templateId` prop)

The item forms currently use `clientId` and `dayNumber`. We need to make them flexible:

```typescript
// Current signature
interface MealItemFormProps {
  clientId: string;
  dayNumber: number;
  // ...
}

// New signature (backwards compatible)
interface MealItemFormProps {
  clientId?: string; // For client plans
  dayNumber?: number; // For client plans
  templateId?: string; // For templates
  // ...
}

// Inside form, determine resource:
const resource = templateId ? "template_diet_items" : "diet_plans";
const payload = templateId
  ? { template_id: templateId, ...data }
  : { client_id: clientId, day_number: dayNumber, ...data };
```

### Components NOT Needed for Templates

- `DaySelectorTabs` - No days in templates
- `CopyDayModal` - Not applicable
- `ClearDayDialog` - Can implement simpler "Clear All" if needed

---

## 6. Implementation Phases

### Phase 1: Database & Types

1. Create migration file
2. Run migration locally
3. Add TypeScript types to `database.types.ts`
4. Add resources to `lib/refine.tsx`

### Phase 2: Template List Page

1. Create `app/admin/config/templates/page.tsx`
2. Create `components/admin/templates/template-list.tsx`
3. Create `components/admin/templates/template-card.tsx`
4. Add "Templates" to admin sidebar
5. Implement CRUD operations (list, delete)

### Phase 3: Template Editor

1. Create `hooks/use-template-data.ts` (adapt from `use-timeline-data.ts`)
2. Create `components/admin/templates/template-editor.tsx`
3. Create `components/admin/templates/template-form-header.tsx`
4. Create `app/admin/config/templates/create/page.tsx`
5. Create `app/admin/config/templates/[id]/edit/page.tsx`

### Phase 4: Modify Item Forms

1. Update `MealItemForm` to support `templateId`
2. Update `SupplementItemForm` to support `templateId`
3. Update `WorkoutItemForm` to support `templateId`
4. Update `LifestyleItemForm` to support `templateId`
5. Update grouped modals to support `templateId`

### Phase 5: Apply Template to Client

1. Create `components/admin/templates/apply-template-modal.tsx`
2. Add "Apply Template" button to Plan Editor page
3. Implement template application logic (copy items to client plan)
4. Add condition incompatibility checking and display

### Phase 6: Condition Warnings

1. Modify `TimelineItem` to show warning badge
2. Implement condition check in Plan Editor after template apply
3. Style warning indicator (orange/amber badge with tooltip)

---

## 7. Detailed Component Specifications

### 7.1 Template List Page (`app/admin/config/templates/page.tsx`)

**UI Elements:**

- Header: "Plan Templates" with "Create Template" button
- Category filter dropdown
- Search by name
- Grid of template cards

**Template Card Shows:**

- Template name
- Category badge
- Description (truncated)
- Item counts: "3 meals, 2 supplements, 1 workout, 2 lifestyle"
- Created date
- Edit / Delete actions

### 7.2 Template Editor (`components/admin/templates/template-editor.tsx`)

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ ← Back to Templates                             │
├─────────────────────────────────────────────────┤
│ TEMPLATE EDITOR                                 │
│ [Name input] [Category dropdown] [Save button]  │
│ [Description textarea - optional]               │
├─────────────────────────────────────────────────┤
│ + ADD ITEM                                      │
├─────────────────────────────────────────────────┤
│ SHOW: [Meals 3] [Supplements 2] [Workouts 1]... │
├─────────────────────────────────────────────────┤
│                                                 │
│  5 AM ─────────────────────────────────────     │
│  6 AM ─────────────────────────────────────     │
│  7 AM ──┌─────────────┐────────────────────     │
│         │ Breakfast   │                         │
│  8 AM ──│ 3 items     │────────────────────     │
│         └─────────────┘                         │
│  ...                                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**State Management:**

```typescript
const [templateName, setTemplateName] = useState("");
const [templateDescription, setTemplateDescription] = useState("");
const [templateCategory, setTemplateCategory] = useState("");
const [activeModal, setActiveModal] = useState<ModalType>(null);
const [editingItem, setEditingItem] = useState<ExtendedTimelineItem | null>(null);
const [viewingGroupedItem, setViewingGroupedItem] = useState<ExtendedTimelineItem | null>(null);
const [typeFilters, setTypeFilters] = useState<TypeFilters>({...});

// For new templates, create template first, then add items
const [templateId, setTemplateId] = useState<string | null>(null);
```

**Create Flow:**

1. User enters name (required), category, description
2. Clicks "Create" or adds first item
3. Template record created, get `templateId`
4. Now can add items to template
5. Auto-save on changes OR explicit "Save" button

### 7.3 Apply Template Modal (`components/admin/templates/apply-template-modal.tsx`)

**Props:**

```typescript
interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  dayNumber: number;
  clientConditions: ClientConditionWithDetails[];
}
```

**UI:**

```
┌─────────────────────────────────────────────────┐
│ Apply Template to Day 3                    [X]  │
├─────────────────────────────────────────────────┤
│ Category: [All ▾]  Search: [____________]       │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ ○ High Protein Day                          │ │
│ │   Weight Loss • 4 meals, 3 supplements      │ │
│ │   ⚠ 2 items may conflict with conditions    │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ ○ Rest Day Template                         │ │
│ │   Rest Day • 3 meals, 2 lifestyle           │ │
│ └─────────────────────────────────────────────┘ │
│ ...                                             │
├─────────────────────────────────────────────────┤
│ Application Mode:                               │
│ ○ Add to existing items                         │
│ ● Replace all items for this day                │
├─────────────────────────────────────────────────┤
│                    [Cancel] [Apply Template]    │
└─────────────────────────────────────────────────┘
```

**Features:**

- Radio selection for template
- Shows preview of template contents
- Pre-checks condition compatibility and shows warning count
- Mode selection: Add vs Replace
- On apply: copies all template items to client's day

### 7.4 Condition Warning Badge

**Location:** `TimelineItem` component

**Trigger:** When item's food has incompatible condition with client

**Display:**

```typescript
// In TimelineItem, add prop:
interface TimelineItemProps {
  // ...existing
  hasConditionWarning?: boolean;
  warningConditions?: string[]; // Names of conflicting conditions
}

// Render:
{hasConditionWarning && (
  <Tooltip content={`Conflicts with: ${warningConditions.join(', ')}`}>
    <Badge variant="warning" className="absolute top-1 right-1">
      <AlertTriangle className="h-3 w-3" />
    </Badge>
  </Tooltip>
)}
```

**Color:** Amber/Orange (`bg-amber-500/20 text-amber-500`)

---

## 8. Data Hook: useTemplateData

```typescript
// hooks/use-template-data.ts

interface UseTemplateDataProps {
  templateId: string | null;
  enabled?: boolean;
}

interface UseTemplateDataReturn {
  template: PlanTemplate | null;
  timelineItems: ExtendedTimelineItem[];
  packingItems: LanePackingItem[];
  dietItems: TemplateDietItemWithFood[];
  supplementItems: TemplateSupplementItemWithSupplement[];
  workoutItems: TemplateWorkoutItemWithExercise[];
  lifestyleItems: TemplateLifestyleItemWithType[];
  isLoading: boolean;
  refetchAll: () => void;
}

export function useTemplateData({
  templateId,
  enabled = true,
}: UseTemplateDataProps): UseTemplateDataReturn {
  // Fetch template metadata
  const templateQuery = useOne<PlanTemplate>({
    resource: "plan_templates",
    id: templateId ?? "",
    queryOptions: { enabled: enabled && !!templateId },
  });

  // Fetch diet items with food relations
  const dietQuery = useList<TemplateDietItemWithFood>({
    resource: "template_diet_items",
    filters: [{ field: "template_id", operator: "eq", value: templateId }],
    meta: {
      select: "*, food_items(*)",
    },
    queryOptions: { enabled: enabled && !!templateId },
  });

  // Similar queries for supplements, workouts, lifestyle...

  // Transform to ExtendedTimelineItem[] (reuse transformation logic)
  const timelineItems = useMemo(() => {
    return transformTemplateItemsToTimeline(
      dietQuery.data?.data ?? [],
      supplementQuery.data?.data ?? [],
      workoutQuery.data?.data ?? [],
      lifestyleQuery.data?.data ?? []
    );
  }, [dietQuery.data, supplementQuery.data, workoutQuery.data, lifestyleQuery.data]);

  // ... rest similar to useTimelineData
}
```

---

## 9. Apply Template Logic

```typescript
// In apply-template-modal.tsx

async function applyTemplate(
  templateId: string,
  clientId: string,
  dayNumber: number,
  mode: "add" | "replace"
) {
  const supabase = createBrowserSupabaseClient();

  // 1. If replace mode, delete existing items for this day
  if (mode === "replace") {
    await Promise.all([
      supabase.from("diet_plans").delete().match({ client_id: clientId, day_number: dayNumber }),
      supabase
        .from("supplement_plans")
        .delete()
        .match({ client_id: clientId, day_number: dayNumber }),
      supabase.from("workout_plans").delete().match({ client_id: clientId, day_number: dayNumber }),
      supabase
        .from("lifestyle_activity_plans")
        .delete()
        .match({ client_id: clientId, day_number: dayNumber }),
    ]);
  }

  // 2. Fetch template items
  const [dietItems, supplementItems, workoutItems, lifestyleItems] = await Promise.all([
    supabase.from("template_diet_items").select("*").eq("template_id", templateId),
    supabase.from("template_supplement_items").select("*").eq("template_id", templateId),
    supabase.from("template_workout_items").select("*").eq("template_id", templateId),
    supabase.from("template_lifestyle_items").select("*").eq("template_id", templateId),
  ]);

  // 3. Transform and insert into client plans
  const dietPlans = dietItems.data?.map((item) => ({
    client_id: clientId,
    day_number: dayNumber,
    food_item_id: item.food_item_id,
    meal_category: item.meal_category,
    serving_multiplier: item.serving_multiplier,
    time_type: item.time_type,
    time_start: item.time_start,
    time_end: item.time_end,
    time_period: item.time_period,
    relative_anchor: item.relative_anchor,
    relative_offset_minutes: item.relative_offset_minutes,
    notes: item.notes,
    display_order: item.display_order,
  }));

  // Similar transformations for other types...

  // 4. Insert all
  await Promise.all([
    dietPlans?.length && supabase.from("diet_plans").insert(dietPlans),
    supplementPlans?.length && supabase.from("supplement_plans").insert(supplementPlans),
    workoutPlans?.length && supabase.from("workout_plans").insert(workoutPlans),
    lifestylePlans?.length && supabase.from("lifestyle_activity_plans").insert(lifestylePlans),
  ]);
}
```

---

## 10. Condition Compatibility Check

```typescript
// In Plan Editor, after template is applied or on load

function checkConditionCompatibility(
  dietPlans: DietPlanWithFood[],
  clientConditions: ClientConditionWithDetails[]
): Map<string, string[]> {
  const warnings = new Map<string, string[]>(); // planId -> condition names

  const conditionIds = new Set(clientConditions.map(c => c.condition_id));

  for (const plan of dietPlans) {
    const foodConditions = plan.food_items?.food_item_conditions ?? [];
    const incompatible = foodConditions
      .filter(fc => conditionIds.has(fc.condition_id))
      .map(fc => {
        const condition = clientConditions.find(c => c.condition_id === fc.condition_id);
        return condition?.medical_conditions?.name ?? 'Unknown';
      });

    if (incompatible.length > 0) {
      warnings.set(plan.id, incompatible);
    }
  }

  return warnings;
}

// Pass to TimelineGrid/TimelineItem:
<TimelineItem
  item={item}
  hasConditionWarning={conditionWarnings.has(item.sourceId)}
  warningConditions={conditionWarnings.get(item.sourceId)}
/>
```

---

## 11. Sidebar Navigation Update

```typescript
// components/admin/admin-sidebar.tsx

// Add under Configuration section:
{
  label: "Templates",
  href: "/admin/config/templates",
  icon: <LayoutTemplate className="h-4 w-4" />,
}
```

---

## 12. Refine Resources

```typescript
// lib/refine.tsx

// Add to resources array:
{
  name: "plan_templates",
  list: "/admin/config/templates",
  create: "/admin/config/templates/create",
  edit: "/admin/config/templates/:id/edit",
},
{
  name: "template_diet_items",
  // No routes - managed through template editor
},
{
  name: "template_supplement_items",
},
{
  name: "template_workout_items",
},
{
  name: "template_lifestyle_items",
},
```

---

## 13. Estimated Effort

| Phase | Description        | Complexity       |
| ----- | ------------------ | ---------------- |
| 1     | Database & Types   | Low              |
| 2     | Template List Page | Medium           |
| 3     | Template Editor    | High (main work) |
| 4     | Modify Item Forms  | Medium           |
| 5     | Apply Template     | Medium           |
| 6     | Condition Warnings | Low              |

**Total:** Medium-High complexity feature

---

## 14. Testing Checklist

### Template CRUD

- [ ] Create template with name only
- [ ] Create template with all fields
- [ ] Edit template metadata
- [ ] Delete template (cascades items)
- [ ] List templates with filtering

### Template Editor

- [ ] Add meal item to template
- [ ] Add supplement item to template
- [ ] Add workout item to template
- [ ] Add lifestyle item to template
- [ ] Edit items in template
- [ ] Delete items from template
- [ ] Grouped items work correctly

### Apply Template

- [ ] Apply to empty day (add mode)
- [ ] Apply to empty day (replace mode)
- [ ] Apply to day with existing items (add mode)
- [ ] Apply to day with existing items (replace mode)
- [ ] Category filtering works
- [ ] Search filtering works

### Condition Warnings

- [ ] Warning shows for incompatible food
- [ ] Warning tooltip shows condition name
- [ ] No warning for compatible food
- [ ] Multiple warnings stack correctly

---

## 15. Future Enhancements (Out of Scope)

- Multi-day templates (weekly plans)
- Template versioning
- Template sharing between admin accounts
- Template import/export
- Template duplication
- Template usage analytics
