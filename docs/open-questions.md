# Open Questions

Decisions the team cannot make alone. Each one blocks the work noted under it. When a question is resolved, record the answer and the date here and update the affected spec.

## Sponsor (Steven McDermott)

### 1. Domain name

**Blocks:** spec and plan 004 (deployment and backups)

Which hostname should the site use?

- **Internal only:** a hostname from UTA IT or the CSE department DNS, such as `labmanager.cse.uta.edu`, resolvable on campus only. Alternatively, no name, and users reach the box by IP address.
- **Public:** a `uta.edu` subdomain from UTA IT plus a firewall opening. This is usually the slowest approval.

The choice depends on who should reach the site. The charter's value proposition promises public 3D scans for prospective students and visitors, while the charter's web page section says the site is reachable only on the SkyNet network.

**Answer:**

### 2. HTTPS certificate

**Blocks:** spec and plan 004. Until resolved, admin passwords and session cookies cross the lab network unencrypted, and `COOKIE_SECURE` stays `false`.

Where does the certificate come from?

- **Public site:** Let's Encrypt, free and renewed automatically, once the hostname resolves publicly.
- **Internal site:** a certificate from UTA IT's certificate service, if one exists for internal hosts.
- **Internal site, no IT service:** a team-run internal certificate authority, installed on the kiosk and every admin machine.

Does UTA IT have a process for this, and who files the request?

**Answer:**

### 3. Backup method and frequency

**Blocks:** spec and plan 004

The team proposes continuous Postgres archiving with pgBackRest to the external SSD:

- Worst-case loss is about one minute of edits.
- A full backup runs weekly and a differential daily.
- About one month of point-in-time history is kept.
- Photos are copied to the SSD hourly.

The simpler alternative is nightly dumps, which can lose up to a day of edits.

Questions:

- How much data loss is acceptable: about a minute, or up to a day?
- Is an off-site copy needed? The SSD sits next to the box, so fire or theft takes both. Options include a UTA network share or a second SSD that rotates off site.
- How long should backup history be kept?
- Who purchases the SSD? It is budgeted in the charter at $100.
- Who checks that backups succeed: a weekly look at a status script, or alerts sent somewhere?

**Answer:**

### 4. Issue report notifications

**Blocks:** notifications only. Slice 007 (issues) ships without them, and a notifier can be added later without changing the issues feature.

How should admins learn about new issue reports?

- **Admin queue only:** reports wait in the admin pages, which show a count badge. There are no external dependencies, but Steven sees reports only when he opens the admin pages.
- **Email:** each new report, or only safety reports, emails the admins. This needs a UTA SMTP relay or a mail account approved by IT.
- **Chat webhook:** new reports post to a Teams, Discord, or Slack channel. This is immediate, but the box needs outbound internet access.

Should safety reports be treated differently, such as always notifying immediately?

**Answer:**

## Team

### 5. Showcase videos

**Blocks:** video support in slice 008 (showcase). The slice ships without videos. If videos are wanted, they are added later as an additive `videos` list on projects.

Should showcase projects have videos at all? If so, should they be embedded links or uploaded files?

- **No videos:** projects keep photos and external links only. A demo video can still be shared as an external link.
- **Embedded links:** YouTube or Vimeo URLs, embedded by the frontend. There is no storage or processing cost, but viewers need internet access and the videos live on a third-party site.
- **Uploaded MP4 files:** validated with `ffprobe`, with a poster frame extracted by `ffmpeg` and no transcoding. Files are capped in size and served by nginx. This works without internet, but it adds about 80 MB of ffmpeg to the image, and videos consume disk and backup space on the box.
- **Both:** one ordered video list per project, where each entry is either a link or an upload.

Transcoding uploads into web formats is ruled out. It would pin the box's CPU for minutes per video.

This depends partly on sponsor question 1 (whether the site and kiosk have internet access) and on the box's disk size.

**Answer:**
