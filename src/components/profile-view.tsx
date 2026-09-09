import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Download,
  FileText,
  GraduationCap,
  Languages,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";

import { initials, type ProfileContent } from "@/lib/content";
import { publicProfileUrl } from "@/lib/public-url";
import { QrShareCard } from "@/components/qr-share-card";

type ProfileViewProps = {
  slug: string;
  content: ProfileContent;
  preview?: boolean;
  avatarUrl?: string | null;
};

function Section({
  title,
  eyebrow,
  icon,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="profile-section">
      <div className="section-heading">
        <span className="section-icon">{icon}</span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function Avatar({ content, src }: { content: ProfileContent; src?: string | null }) {
  if (src && content.avatarAssetId) {
    return (
      <div className="profile-avatar profile-avatar--image">
        <Image src={src} alt={`Foto de ${content.fullName}`} width={224} height={224} priority unoptimized />
      </div>
    );
  }
  return <div className="profile-avatar profile-avatar--initials" aria-label={`Iniciales de ${content.fullName}`}>{initials(content.fullName)}</div>;
}

export function ProfileView({ slug, content, preview = false, avatarUrl }: ProfileViewProps) {
  const profileUrl = publicProfileUrl(slug);
  const contactItems = [
    content.contact.email ? { label: content.contact.email, href: `mailto:${content.contact.email}`, icon: <Mail size={17} /> } : null,
    content.contact.phone ? { label: content.contact.phone, href: `tel:${content.contact.phone.replace(/[^+\d]/g, "")}`, icon: <Phone size={17} /> } : null,
    content.contact.location ? { label: content.contact.location, href: null, icon: <MapPin size={17} /> } : null,
  ].filter(Boolean) as { label: string; href: string | null; icon: React.ReactNode }[];

  return (
    <main className="profile-page">
      {preview && <div className="preview-banner"><Sparkles size={16} /> Vista privada del borrador. Nadie más puede verla.</div>}
      <section className="profile-hero">
        <div className="profile-hero__grid" />
        <div className="profile-shell profile-hero__content">
          <Link className="brand brand--light" href="/" aria-label="EProfile, inicio">
            <span className="brand-mark">E</span><span>Profile</span>
          </Link>
          <div className="profile-hero__body">
            <Avatar content={content} src={avatarUrl} />
            <div className="profile-identity">
              <p className="eyebrow eyebrow--light">Tarjeta profesional</p>
              <h1>{content.fullName}</h1>
              <p className="profile-career">{content.career}</p>
              {content.summary && <p className="profile-summary">{content.summary}</p>}
              {contactItems.length > 0 && (
                <div className="contact-pills">
                  {contactItems.map((item) =>
                    item.href ? (
                      <a key={item.label} href={item.href} className="contact-pill">{item.icon}<span>{item.label}</span></a>
                    ) : <span key={item.label} className="contact-pill">{item.icon}<span>{item.label}</span></span>,
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="profile-shell profile-layout">
        <div className="profile-main">
          {content.education.length > 0 && (
            <Section eyebrow="Formación" title="Educación" icon={<GraduationCap size={19} />}>
              <div className="timeline-list">
                {content.education.map((item, index) => (
                  <article className="timeline-item" key={`${item.institution}-${index}`}>
                    <span className="timeline-dot" />
                    <div><h3>{item.institution}</h3><p>{item.program}</p></div>
                    {item.period && <span className="period">{item.period}</span>}
                  </article>
                ))}
              </div>
            </Section>
          )}

          {content.experience.length > 0 && (
            <Section eyebrow="Trayectoria" title="Experiencia y participación" icon={<BriefcaseBusiness size={19} />}>
              <div className="entry-list">
                {content.experience.map((item, index) => (
                  <article className="content-entry" key={`${item.title}-${index}`}>
                    <div className="entry-title-row"><div><h3>{item.title}</h3>{item.organization && <p>{item.organization}</p>}</div>{item.period && <span className="period">{item.period}</span>}</div>
                    {item.description && <p className="entry-description">{item.description}</p>}
                  </article>
                ))}
              </div>
            </Section>
          )}

          {content.projects.length > 0 && (
            <Section eyebrow="Portafolio" title="Proyectos" icon={<Code2 size={19} />}>
              <div className="project-grid">
                {content.projects.map((item, index) => (
                  <article className="project-card" key={`${item.title}-${index}`}>
                    <div className="project-card__top"><span className="tag">{item.academic ? "Académico" : "Profesional"}</span>{item.year && <span className="period">{item.year}</span>}</div>
                    <h3>{item.title}</h3>
                    {item.role && <p className="project-role">{item.role}</p>}
                    {item.description && <p>{item.description}</p>}
                    {item.technologies && <p className="project-tech">{item.technologies}</p>}
                    {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="inline-link">Ver proyecto <ArrowUpRight size={15} /></a>}
                  </article>
                ))}
              </div>
            </Section>
          )}

          {content.achievements.length > 0 && (
            <Section eyebrow="Distinciones" title="Reconocimientos" icon={<Award size={19} />}>
              <div className="entry-list">
                {content.achievements.map((item, index) => (
                  <article className="content-entry" key={`${item.title}-${index}`}>
                    <div className="entry-title-row"><div><h3>{item.title}</h3>{item.issuer && <p>{item.issuer}</p>}</div>{item.year && <span className="period">{item.year}</span>}</div>
                    {item.description && <p className="entry-description">{item.description}</p>}
                  </article>
                ))}
              </div>
            </Section>
          )}

          {content.courses.length > 0 && (
            <Section eyebrow="Actualización" title="Cursos y certificaciones" icon={<BookOpen size={19} />}>
              <ul className="course-list">
                {content.courses.map((item, index) => <li key={`${item.title}-${index}`}><span>{item.title}</span>{item.status && <em>{item.status}</em>}</li>)}
              </ul>
            </Section>
          )}
        </div>

        <aside className="profile-aside">
          {content.skills.length > 0 && (
            <section className="side-card">
              <div className="section-heading section-heading--compact"><span className="section-icon"><Sparkles size={18} /></span><div><p className="eyebrow">Fortalezas</p><h2>Habilidades</h2></div></div>
              {content.skills.map((group, index) => (
                <div className="skill-group" key={`${group.category}-${index}`}>
                  {group.category && <h3>{group.category}</h3>}
                  <div className="skill-tags">{group.items.map((item) => <span key={item}>{item}</span>)}</div>
                </div>
              ))}
            </section>
          )}
          {content.languages.length > 0 && (
            <section className="side-card compact-list"><div className="section-heading section-heading--compact"><span className="section-icon"><Languages size={18} /></span><div><p className="eyebrow">Comunicación</p><h2>Idiomas</h2></div></div>{content.languages.map((language) => <p key={language}>{language}</p>)}</section>
          )}
          {content.links.length > 0 && (
            <section className="side-card compact-list"><div className="section-heading section-heading--compact"><span className="section-icon"><LinkIcon size={18} /></span><div><p className="eyebrow">En línea</p><h2>Enlaces</h2></div></div>{content.links.map((link, index) => <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer" className="text-link">{link.label || link.url}<ArrowUpRight size={15} /></a>)}</section>
          )}
          {!preview && <QrShareCard slug={slug} profileUrl={profileUrl} name={content.fullName} />}
          {!preview && (
            <section className="download-card no-print">
              <FileText size={21} />
              <div><p className="eyebrow">Currículum</p><h2>Descarga mi CV</h2></div>
              <div className="download-card__actions">
                <a className="button button--primary" href={`/api/profile/${encodeURIComponent(slug)}/pdf?template=${content.pdfTemplate}`}><Download size={16} /> PDF</a>
                <a className="button button--secondary" href={`/api/profile/${encodeURIComponent(slug)}/vcard`}><Download size={16} /> vCard</a>
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
