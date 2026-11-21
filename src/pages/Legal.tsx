import { Link } from "react-router-dom";
import { CHANNEL, IG, YT } from "../lib/channel";

const Shell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-full bg-parchment px-4 py-10 text-ink dark:bg-night-950 dark:text-parchment">
    <article className="prose-studio mx-auto">
      <Link to="/about" className="text-sm font-semibold text-gold-deep no-underline dark:text-gold">{CHANNEL.app_title}</Link>
      <h1>{title}</h1>
      {children}
      <p className="mt-10 text-sm opacity-70">Last updated 18 November 2026 · Contact: {CHANNEL.owner.contact_email}</p>
    </article>
  </div>
);

export function About() {
  return (
    <Shell title={CHANNEL.app_title}>
      <p>{CHANNEL.app_title} is the private production tool of the <b>{CHANNEL.name}</b> channel (Instagram <b>{IG.handle}</b>, YouTube <b>{YT.handle}</b>), which publishes short story videos with citations from the original texts.</p>
      <p>The studio is used only by the channel's own team to prepare videos and publish them to the channel's own Instagram and YouTube accounts. It is not offered to the public.</p>
      <p><Link to="/privacy">Privacy policy</Link> · <Link to="/terms">Terms of service</Link> · <Link to="/">Team sign-in</Link></p>
    </Shell>
  );
}

export function Privacy() {
  return (
    <Shell title="Privacy policy">
      <p>This policy covers {CHANNEL.app_title} ("the studio"), a private tool used only by the {CHANNEL.name} team.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Team sign-in:</b> the email address of team members, used only to sign in.</li>
        <li><b>Connected accounts:</b> when the team connects the channel's own YouTube or Instagram account, the studio stores the access tokens those platforms issue, plus the channel or account name. They are stored on the studio's server, are never shown in the browser, and are used only to upload the channel's own videos and captions when a team member presses "Post now".</li>
      </ul>
      <h2>Google user data</h2>
      <p>The studio requests the YouTube scopes <code>youtube.upload</code> (to upload the channel's videos) and <code>youtube.readonly</code> (to show which channel is connected). Data obtained from Google APIs is used only for these purposes, is not sold, not shared with third parties, not used for advertising, and not used to train AI models. The studio's use of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
      <h2>Instagram data</h2>
      <p>The studio uses <code>instagram_business_basic</code> and <code>instagram_business_content_publish</code> only to identify the connected account and publish the channel's own reels.</p>
      <h2>Retention and deletion</h2>
      <p>Disconnecting an account in Settings → Connections deletes its tokens immediately. You can also revoke access at any time from your Google Account (Security → Third-party access) or Instagram (Settings → Website permissions → Apps and websites). To ask for deletion of any data, email the contact below.</p>
      <h2>Security</h2>
      <p>Data is stored in a private database with row-level access controls; tokens are readable only by the studio's server functions.</p>
    </Shell>
  );
}

export function Terms() {
  return (
    <Shell title="Terms of service">
      <p>{CHANNEL.app_title} is a private tool for the {CHANNEL.name} team. Access is limited to people the channel owner has added.</p>
      <ul>
        <li>Use the studio only to prepare and publish the {CHANNEL.name} channel's own content.</li>
        <li>Content published through the studio must follow the YouTube and Instagram terms and community guidelines.</li>
        <li>The studio is provided as is, without warranty. The channel owner may change or withdraw access at any time.</li>
      </ul>
    </Shell>
  );
}
