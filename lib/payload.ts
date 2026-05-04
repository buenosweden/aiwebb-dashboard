/**
 * TypeScript-typer för payload-schemat.
 */

export type SectionType =
  | "hero"
  | "usp_row"
  | "text_block"
  | "table"
  | "cta_band"
  | "faq"
  | "feature_grid"
  | "image_text"
  | "stats"
  | "testimonial"
  | "contact"
  | "team";

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
  data: { items: Array<{ icon?: string; label: string; description?: string }>; };
}

export interface TextBlockSection {
  type: "text_block";
  data: { heading: string; body: string; layout?: "single" | "two-col"; };
}

export interface TableSection {
  type: "table";
  data: { heading: string; intro?: string; columns: string[]; rows: string[][]; };
}

export interface CtaBandSection {
  type: "cta_band";
  data: { heading: string; body?: string; cta: CTA; background?: "accent" | "muted" | "dark"; };
}

export interface FaqSection {
  type: "faq";
  data: {
    heading: string;
    subtitle?: string;
    body?: string;
    cta?: CTA;
    items: Array<{ question: string; answer: string }>;
  };
}

export interface FeatureGridSection {
  type: "feature_grid";
  data: { heading: string; intro?: string; items: Array<{ title: string; description: string; icon?: string }>; };
}

export interface ImageTextSection {
  type: "image_text";
  data: { subtitle?: string; heading: string; body?: string; image_url?: string; cta?: CTA; checklist?: string[]; };
}

export interface StatsSection {
  type: "stats";
  data: { items: Array<{ value: string; label: string; description?: string }>; };
}

export interface TestimonialSection {
  type: "testimonial";
  data: { quote: string; name: string; title?: string; };
}

export interface ContactSection {
  type: "contact";
  data: { subtitle?: string; heading: string; body?: string; phone?: string; form_title?: string; cta_label?: string; };
}

export interface TeamSection {
  type: "team";
  data: { subtitle?: string; heading: string; members: Array<{ name: string; role?: string; bio?: string; image_url?: string }>; };
}

export type Section =
  | HeroSection | UspRowSection | TextBlockSection | TableSection
  | CtaBandSection | FaqSection | FeatureGridSection | ImageTextSection
  | StatsSection | TestimonialSection | ContactSection | TeamSection;

export interface Brand {
  name?: string;
  primary_color?: string;
  secondary_color?: string;
  tone?: "professional" | "warm" | "direct" | "playful";
  logo_url?: string;
  theme_id?: "edge" | "clean" | "warm";
  site_type?: "landing" | "full";
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
