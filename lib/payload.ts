/**
 * TypeScript-typer för payload-schemat.
 *
 * Det här är samma schema som aiwebb-publisher-pluginet validerar mot.
 * Det är KONTRAKTET mellan dashboardet och WordPress — om du ändrar här
 * måste du också ändra i plugin/includes/class-aiwebb-validator.php.
 *
 * När vi senare migrerar till headless blir detta kontraktet mellan
 * dashboardet och vår egna renderer. Inget annat ändras.
 */

export type SectionType =
  | "hero"
  | "usp_row"
  | "text_block"
  | "table"
  | "cta_band"
  | "faq"
  | "feature_grid";

export interface CTA {
  label: string;
  url: string;
  style?: "primary" | "secondary";
}

export interface HeroSection {
  type: "hero";
  variant?: "centered" | "split" | "image-bg";
  data: {
    eyebrow?: string;
    headline: string;
    subheadline?: string;
    primary_cta: CTA;
    secondary_cta?: Omit<CTA, "style">;
    image_url?: string;
  };
}

export interface UspRowSection {
  type: "usp_row";
  data: {
    items: Array<{
      icon?: string;
      label: string;
      description?: string;
    }>;
  };
}

export interface TextBlockSection {
  type: "text_block";
  data: {
    heading: string;
    body: string;
    layout?: "single" | "two-col";
  };
}

export interface TableSection {
  type: "table";
  data: {
    heading: string;
    intro?: string;
    columns: string[];
    rows: string[][];
  };
}

export interface CtaBandSection {
  type: "cta_band";
  data: {
    heading: string;
    body?: string;
    cta: CTA;
    background?: "accent" | "muted" | "dark";
  };
}

export interface FaqSection {
  type: "faq";
  data: {
    heading: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
}

export interface FeatureGridSection {
  type: "feature_grid";
  data: {
    heading: string;
    intro?: string;
    items: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
  };
}

export type Section =
  | HeroSection
  | UspRowSection
  | TextBlockSection
  | TableSection
  | CtaBandSection
  | FaqSection
  | FeatureGridSection;

export interface Brand {
  name?: string;
  primary_color?: string;
  secondary_color?: string;
  tone?: "professional" | "warm" | "direct" | "playful";
  logo_url?: string;
}

export interface SEO {
  meta_title: string;
  meta_description: string;
  focus_keyword?: string;
  og_image_url?: string;
  schema_markup?: Record<string, unknown>[];
}

export interface PageMeta {
  title: string;
  slug: string;
  is_front_page?: boolean;
  template?: "default" | "landing" | "full-width";
}

export interface Payload {
  page: PageMeta;
  brand?: Brand;
  seo: SEO;
  meta?: {
    generated_at?: string;
    model?: string;
    prompt_version?: string;
    onboarding_id?: string;
    keywords_used?: string[];
  };
  sections: Section[];
}
