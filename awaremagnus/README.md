# Aware Magnus - Security Awareness Management (AWM)

Aware Magnus is a premium, feature-rich Security Awareness Management platform designed to help organizations monitor, manage, and improve their cybersecurity posture through employee training, gamification, and comprehensive risk analytics.

## 🚀 Vision

To empower organizations with data-driven insights and engaging learning experiences that transform employees from the weakest link into the strongest line of defense.

## 🛠 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **UI Framework**: [HeroUI (formerly NextUI)](https://heroui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **API Client**: [Axios](https://axios-http.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Charts**: [ApexCharts](https://apexcharts.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Internationalization**: Custom i18n implementation

## 📁 Project Structure

```text
├── app/                  # Next.js App Router (pages and layouts)
├── components/           # Reusable UI components
│   ├── modules/          # Feature-specific modules (Dashboard, etc.)
│   └── auth/             # Authentication-related components
├── services/             # API service layer (Dashboard, Auth, etc.)
├── hooks/                # Custom React hooks (React Query integrations)
├── types/                # TypeScript interfaces and definitions
├── utils/                # Helper functions and utilities
├── config/               # Project-wide configurations
├── i18n/                 # Internationalization logic and dictionaries
├── public/               # Static assets (images, icons, fonts)
└── styles/               # Global styles and Tailwind configurations
```

## 🌟 Key Features

### 1. Role-Based Dashboards

The application provides a tailors experience for three main roles:

- **Platform Admin (Super Admin)**: System-wide overview of all organizations, aggregated risk metrics, and global leaderboards.
- **Organization Admin**: Detailed analytics for their specific organization, employee risk states, and training completion rates.
- **Organization User**: Personalized dashboard showing individual progress, certifications, and personal scores.

### 2. Gamification Engine

- **Achievements**: Unlockable badges for completing modules and maintaining streaks.
- **Avatar System**: 14 levels of avatar evolution from "Vulnerable Newbie" to "Master" based on security scores.
- **Leaderboards**: Competitive ranking for organizations and employees to encourage participation.

### 3. Comprehensive Analytics

- **Security Posture Bar**: Visual representation of organization-wide compliance.
- **Struggling Modules**: Identification of topics where employees need more attention.
- **Course Completion Rate**: Monthly tracking of training velocity.
- **Risk Distribution**: Semi-circle charts showing low, medium, and high-risk segments.

### 4. Advanced Architecture

- **API Interceptors**: Seamless JWT token handling and 401/403 auto-logout logic.
- **Type-Safe API Calls**: Full TypeScript coverage for all dashboard and gamification endpoints.
- **Reactive State**: Unified state management using Zustand for auth and configuration.

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install
```

### Development

```bash
# Run the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🔒 Authentication

The platform uses JWT-based authentication. The `httpClient` automatically attaches the bearer token to every request and handles unauthorized responses through a centralized interceptor.

## 🌍 Internationalization

Supported languages and directions (LTR/RTL) are managed in the `i18n` module. The app automatically adapts its layout and content based on the user's preferred locale.

## 📄 License

This project is licensed under the MIT License.

## Obfuscated Build And Deployment

- Production builds use Webpack (via `next build`). The project is configured to apply Webpack obfuscation only to client bundles in `next.config.js` (so server/API code and middleware are not obfuscated).

- To generate an obfuscated production build (client bundles are obfuscated by the Webpack plugin):

```bash
# from the awaremagnus project root
npm install
npm run build
```

- Package and copy the built files into the centralized obfuscated bundle (example, adjust paths for your environment):

Create a directory inside the central obfuscated bundle (for example: Secure-Magnus-obfuscated/suite_webapp/awaremagnus) and place or copy the built artifacts into it (.next, public, package.json, README.md, next.config.js, etc.).

- On the target (inside the obfuscated bundle) install production deps and start:

```bash
cd Secure-Magnus-obfuscated/suite_webapp/awaremagnus
npm install
npm start
```

Note: The central `start-all-obfuscated.ps1` will attempt to start this path automatically once the folder is present. Ensure `node` and `npm` are available on the host.
