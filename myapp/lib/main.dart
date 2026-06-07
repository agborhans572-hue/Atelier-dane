import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dane Design Studio',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFE8B86D),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF0A0A0A),
        fontFamily: 'Georgia',
      ),
      home: const HomePage(),
    );
  }
}

// ─── Color palette ───────────────────────────────────────────────────────────
const Color kBg = Color(0xFF0A0A0A);
const Color kCard = Color(0xFF111111);
const Color kBorder = Color(0xFF1E1E1E);
const Color kAccent = Color(0xFFE8B86D);
const Color kAccentDim = Color(0xFF3A2E1A);
const Color kText = Color(0xFFF2F2F2);
const Color kMuted = Color(0xFF888888);
const Color kDivider = Color(0xFF1A1A1A);

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      body: SingleChildScrollView(
        child: Column(
          children: const [
            _NavBar(),
            _HeroSection(),
            _MarqueeStrip(),
            _ServicesSection(),
            _WorkSection(),
            _StatsSection(),
            _ProcessSection(),
            _TestimonialSection(),
            _CtaSection(),
            _Footer(),
          ],
        ),
      ),
    );
  }
}

// ─── Navigation ──────────────────────────────────────────────────────────────
class _NavBar extends StatelessWidget {
  const _NavBar();

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final compact = w < 700;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 24 : 64,
        vertical: 24,
      ),
      decoration: const BoxDecoration(
        color: kBg,
        border: Border(bottom: BorderSide(color: kBorder)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Logo
          RichText(
            text: const TextSpan(
              children: [
                TextSpan(
                  text: 'DANE',
                  style: TextStyle(
                    color: kText,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 3,
                  ),
                ),
                TextSpan(
                  text: '.',
                  style: TextStyle(
                    color: kAccent,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          if (!compact)
            Row(
              children: [
                _navLink('Work'),
                const SizedBox(width: 36),
                _navLink('Services'),
                const SizedBox(width: 36),
                _navLink('About'),
                const SizedBox(width: 36),
                _navLink('Journal'),
              ],
            ),
          // CTA
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              color: kAccent,
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Text(
              'Let\'s Talk',
              style: TextStyle(
                color: Colors.black,
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _navLink(String label) {
    return Text(
      label,
      style: const TextStyle(
        color: kMuted,
        fontSize: 14,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.3,
      ),
    );
  }
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
class _HeroSection extends StatelessWidget {
  const _HeroSection();

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final compact = w < 700;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 24 : 80,
        vertical: compact ? 64 : 100,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Eyebrow
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: kAccentDim,
              borderRadius: BorderRadius.circular(100),
              border: Border.all(color: kAccent.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: kAccent,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Available for new projects',
                  style: TextStyle(
                    color: kAccent,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 36),
          // Headline
          Text(
            compact
                ? 'We craft\ndigital\nexperiences\nthat endure.'
                : 'We craft digital\nexperiences that\nendure.',
            style: TextStyle(
              color: kText,
              fontSize: compact ? 48 : 72,
              fontWeight: FontWeight.w800,
              height: 1.1,
              letterSpacing: -1.5,
            ),
          ),
          const SizedBox(height: 28),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: const Text(
              'Dane Design Studio is a boutique creative agency specialising in brand identity, UI/UX design, and digital experiences for ambitious founders and forward-thinking companies.',
              style: TextStyle(
                color: kMuted,
                fontSize: 16,
                height: 1.7,
              ),
            ),
          ),
          const SizedBox(height: 48),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _HeroButton(
                label: 'View Our Work',
                filled: true,
                onTap: () {},
              ),
              _HeroButton(
                label: 'Start a Project →',
                filled: false,
                onTap: () {},
              ),
            ],
          ),
          const SizedBox(height: 80),
          // Social proof row
          if (!compact)
            Row(
              children: [
                _AvatarStack(),
                const SizedBox(width: 16),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '50+ satisfied clients',
                      style: TextStyle(
                        color: kText,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'from 18 countries worldwide',
                      style: TextStyle(color: kMuted, fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(width: 48),
                Container(
                  width: 1,
                  height: 40,
                  color: kBorder,
                ),
                const SizedBox(width: 48),
                Row(
                  children: [
                    ...List.generate(5, (_) => const Icon(
                      Icons.star,
                      color: kAccent,
                      size: 16,
                    )),
                    const SizedBox(width: 10),
                    const Text(
                      '4.9 / 5.0 average rating',
                      style: TextStyle(color: kMuted, fontSize: 13),
                    ),
                  ],
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _HeroButton extends StatelessWidget {
  const _HeroButton({
    required this.label,
    required this.filled,
    required this.onTap,
  });

  final String label;
  final bool filled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
        decoration: BoxDecoration(
          color: filled ? kAccent : Colors.transparent,
          borderRadius: BorderRadius.circular(4),
          border: filled ? null : Border.all(color: kBorder),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: filled ? Colors.black : kText,
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }
}

class _AvatarStack extends StatelessWidget {
  const _AvatarStack();

  static const _colors = [
    Color(0xFF4F46E5),
    Color(0xFFE8B86D),
    Color(0xFF10B981),
    Color(0xFFF43F5E),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 80,
      height: 36,
      child: Stack(
        children: List.generate(4, (i) {
          return Positioned(
            left: i * 18.0,
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: _colors[i],
                shape: BoxShape.circle,
                border: Border.all(color: kBg, width: 2),
              ),
              child: Center(
                child: Text(
                  ['J', 'A', 'M', 'S'][i],
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ─── Marquee / scrolling strip ────────────────────────────────────────────────
class _MarqueeStrip extends StatelessWidget {
  const _MarqueeStrip();

  static const _items = [
    'Brand Identity',
    '✦',
    'UI / UX Design',
    '✦',
    'Web Design',
    '✦',
    'Motion & Video',
    '✦',
    'Design Systems',
    '✦',
    'Packaging',
    '✦',
    'Strategy',
    '✦',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 18),
      decoration: const BoxDecoration(
        color: kAccent,
        border: Border.symmetric(
          horizontal: BorderSide(color: kAccentDim, width: 0.5),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            ...List.generate(3, (_) => Row(
              children: _items
                  .map(
                    (item) => Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Text(
                        item,
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            )),
          ],
        ),
      ),
    );
  }
}

// ─── Services ─────────────────────────────────────────────────────────────────
class _ServicesSection extends StatelessWidget {
  const _ServicesSection();

  static const _services = [
    _ServiceItem(
      icon: Icons.auto_awesome_outlined,
      title: 'Brand Identity',
      description:
          'We build brands that stand the test of time — from naming and strategy to logo systems, colour, typography, and every touchpoint in between.',
      tags: ['Logo Design', 'Brand Strategy', 'Style Guide'],
    ),
    _ServiceItem(
      icon: Icons.devices_outlined,
      title: 'UI / UX Design',
      description:
          'User-centred interfaces grounded in research, crafted for clarity and delight. We turn complex problems into intuitive, beautiful digital products.',
      tags: ['Web Apps', 'Mobile', 'Prototyping'],
    ),
    _ServiceItem(
      icon: Icons.language_outlined,
      title: 'Web Design',
      description:
          'High-performance websites that convert visitors into clients. Pixel-perfect, responsive, and built to represent your brand at its absolute best.',
      tags: ['Marketing Sites', 'E-commerce', 'Portfolios'],
    ),
    _ServiceItem(
      icon: Icons.movie_creation_outlined,
      title: 'Motion & Video',
      description:
          'Animated brand assets, explainer videos, and motion design that bring your story to life and capture attention in a crowded digital landscape.',
      tags: ['Animations', 'Brand Films', 'Social Content'],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final compact = w < 700;
    final crossCount = w > 1100 ? 4 : (w > 700 ? 2 : 1);

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 24 : 80,
        vertical: 96,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionLabel(label: 'Our Services'),
          const SizedBox(height: 20),
          const Text(
            'What we do best.',
            style: TextStyle(
              color: kText,
              fontSize: 44,
              fontWeight: FontWeight.w800,
              height: 1.1,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 56),
          GridView.count(
            crossAxisCount: crossCount,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: crossCount == 1 ? 2.2 : 0.85,
            children: _services
                .map((s) => _ServiceCard(item: s))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _ServiceItem {
  const _ServiceItem({
    required this.icon,
    required this.title,
    required this.description,
    required this.tags,
  });

  final IconData icon;
  final String title;
  final String description;
  final List<String> tags;
}

class _ServiceCard extends StatelessWidget {
  const _ServiceCard({required this.item});

  final _ServiceItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: kAccentDim,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(item.icon, color: kAccent, size: 22),
          ),
          const SizedBox(height: 20),
          Text(
            item.title,
            style: const TextStyle(
              color: kText,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            item.description,
            style: const TextStyle(
              color: kMuted,
              fontSize: 13.5,
              height: 1.65,
            ),
          ),
          const Spacer(),
          const SizedBox(height: 20),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: item.tags
                .map(
                  (t) => Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: kBg,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: kBorder),
                    ),
                    child: Text(
                      t,
                      style: const TextStyle(
                        color: kMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

// ─── Work / Portfolio ─────────────────────────────────────────────────────────
class _WorkSection extends StatelessWidget {
  const _WorkSection();

  static const _projects = [
    _ProjectItem(
      category: 'Brand Identity',
      title: 'Aurum Finance',
      description:
          'Complete rebrand for a fintech startup — from strategy through to a full identity system.',
      color: Color(0xFF1A1608),
      accent: Color(0xFFE8B86D),
      number: '01',
    ),
    _ProjectItem(
      category: 'UI / UX Design',
      title: 'Orbit Dashboard',
      description:
          'SaaS analytics platform redesign. Reduced task completion time by 34% through streamlined information architecture.',
      color: Color(0xFF080E1A),
      accent: Color(0xFF4F8EF7),
      number: '02',
    ),
    _ProjectItem(
      category: 'Web Design',
      title: 'Solstice Studio',
      description:
          'Award-winning portfolio site for a luxury architecture firm. 180% increase in qualified leads post-launch.',
      color: Color(0xFF0A1208),
      accent: Color(0xFF4ADE80),
      number: '03',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final compact = w < 700;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 24 : 80,
        vertical: 96,
      ),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: kDivider)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SectionLabel(label: 'Selected Work'),
                  const SizedBox(height: 20),
                  const Text(
                    'Projects we\'re\nproud of.',
                    style: TextStyle(
                      color: kText,
                      fontSize: 44,
                      fontWeight: FontWeight.w800,
                      height: 1.1,
                      letterSpacing: -1,
                    ),
                  ),
                ],
              ),
              if (!compact)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: kBorder),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'View all work →',
                    style: TextStyle(
                      color: kMuted,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 56),
          Column(
            children: _projects
                .map((p) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _ProjectCard(item: p, compact: compact),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _ProjectItem {
  const _ProjectItem({
    required this.category,
    required this.title,
    required this.description,
    required this.color,
    required this.accent,
    required this.number,
  });

  final String category;
  final String title;
  final String description;
  final Color color;
  final Color accent;
  final String number;
}

class _ProjectCard extends StatelessWidget {
  const _ProjectCard({required this.item, required this.compact});

  final _ProjectItem item;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(compact ? 24 : 40),
      decoration: BoxDecoration(
        color: item.color,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: kBorder),
      ),
      child: compact
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: _content(item, compact),
            )
          : Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: _content(item, compact),
                  ),
                ),
                Container(
                  width: 200,
                  height: 140,
                  decoration: BoxDecoration(
                    color: item.accent.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: item.accent.withValues(alpha: 0.15)),
                  ),
                  child: Center(
                    child: Text(
                      item.number,
                      style: TextStyle(
                        color: item.accent.withValues(alpha: 0.25),
                        fontSize: 80,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  List<Widget> _content(_ProjectItem item, bool compact) {
    return [
      Text(
        item.category.toUpperCase(),
        style: TextStyle(
          color: item.accent,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 2,
        ),
      ),
      const SizedBox(height: 12),
      Text(
        item.title,
        style: const TextStyle(
          color: kText,
          fontSize: 28,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
      ),
      const SizedBox(height: 12),
      Text(
        item.description,
        style: const TextStyle(
          color: kMuted,
          fontSize: 14,
          height: 1.6,
        ),
      ),
      const SizedBox(height: 24),
      Row(
        children: [
          Text(
            'View case study',
            style: TextStyle(
              color: item.accent,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 6),
          Icon(Icons.arrow_forward, color: item.accent, size: 14),
        ],
      ),
    ];
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────
class _StatsSection extends StatelessWidget {
  const _StatsSection();

  static const _stats = [
    ('50+', 'Projects Delivered'),
    ('18', 'Countries Served'),
    ('7', 'Years of Experience'),
    ('100%', 'Client Satisfaction'),
  ];

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final compact = w < 700;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 24 : 80,
        vertical: 80,
      ),
      decoration: const BoxDecoration(
        color: kCard,
        border: Border.symmetric(
          horizontal: BorderSide(color: kBorder),
        ),
      ),
      child: Wrap(
        spacing: 40,
        runSpacing: 48,
        alignment: WrapAlignment.spaceBetween,
        children: _stats
            .map(
              (s) => SizedBox(
                width: compact ? double.infinity : 180,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.$1,
                      style: const TextStyle(
                        color: kAccent,
                        fontSize: 52,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      s.$2,
                      style: const TextStyle(
                        color: kMuted,
                        fontSize: 15,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

// ─── Process ─────────────────────────────────────────────────────────────────
class _ProcessSection extends StatelessWidget {
  const _ProcessSection();

  static const _steps = [
    ('Discover', 'We start by listening — deeply understanding your goals, audience, and the problem we\'re solving together.'),
    ('Define', 'Research, strategy, and clear creative direction. We map out the path before we touch a single pixel.'),
    ('Design', 'Concepts are refined through iteration and collaboration, always anchored to your brand and user needs.'),
    ('Deliver', 'Pixel-perfect assets, thorough documentation, and ongoing support to ensure a seamless handover.'),
  ];

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final compact = w < 700;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 24 : 80,
        vertical: 96,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionLabel(label: 'Our Process'),
          const SizedBox(height: 20),
          const Text(
            'How we work.',
            style: TextStyle(
              color: kText,
              fontSize: 44,
              fontWeight: FontWeight.w800,
              height: 1.1,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 56),
          Column(
            children: List.generate(_steps.length, (i) {
              final step = _steps[i];
              return Container(
                padding: const EdgeInsets.symmetric(vertical: 32),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: i < _steps.length - 1
                        ? const BorderSide(color: kBorder)
                        : BorderSide.none,
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 56,
                      child: Text(
                        '0${i + 1}',
                        style: const TextStyle(
                          color: kAccent,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    const SizedBox(width: 24),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            step.$1,
                            style: const TextStyle(
                              color: kText,
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            step.$2,
                            style: const TextStyle(
                              color: kMuted,
                              fontSize: 14.5,
                              height: 1.65,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (!compact) ...[
                      const SizedBox(width: 40),
                      Icon(
                        Icons.arrow_outward,
                        color: kBorder,
                        size: 20,
                      ),
                    ],
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

// ─── Testimonial ─────────────────────────────────────────────────────────────
class _TestimonialSection extends StatelessWidget {
  const _TestimonialSection();

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final compact = w < 700;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 24 : 80,
        vertical: 96,
      ),
      decoration: const BoxDecoration(
        color: kCard,
        border: Border.symmetric(horizontal: BorderSide(color: kBorder)),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.format_quote,
            color: kAccent,
            size: 40,
          ),
          const SizedBox(height: 32),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 760),
            child: Text(
              '"Working with Dane Design was transformative. They didn\'t just design a brand — they helped us understand who we are. Our new identity increased investor confidence and helped us close our Series A. I\'d recommend them to any founder without hesitation."',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: kText,
                fontSize: compact ? 18 : 22,
                height: 1.65,
                fontStyle: FontStyle.italic,
                letterSpacing: -0.2,
              ),
            ),
          ),
          const SizedBox(height: 40),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  color: Color(0xFF4F46E5),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text(
                    'SL',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Sarah Laurent',
                    style: TextStyle(
                      color: kText,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    'Founder & CEO, Aurum Finance',
                    style: TextStyle(color: kMuted, fontSize: 13),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── CTA ─────────────────────────────────────────────────────────────────────
class _CtaSection extends StatelessWidget {
  const _CtaSection();

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final compact = w < 700;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 24 : 80,
        vertical: 96,
      ),
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 32 : 72,
          vertical: compact ? 56 : 80,
        ),
        decoration: BoxDecoration(
          color: kAccent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Have a project in mind?',
              style: TextStyle(
                color: Colors.black.withValues(alpha: 0.5),
                fontSize: 14,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              compact
                  ? 'Let\'s build\nsomething\ngreat together.'
                  : 'Let\'s build something\ngreat together.',
              style: TextStyle(
                color: Colors.black,
                fontSize: compact ? 38 : 52,
                fontWeight: FontWeight.w900,
                height: 1.1,
                letterSpacing: -1.5,
              ),
            ),
            const SizedBox(height: 36),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 28,
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Start a Project',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                const Text(
                  'or hello@danedesign.co',
                  style: TextStyle(
                    color: Colors.black54,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Footer ───────────────────────────────────────────────────────────────────
class _Footer extends StatelessWidget {
  const _Footer();

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final compact = w < 700;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 24 : 80,
        vertical: 48,
      ),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: kBorder)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              RichText(
                text: const TextSpan(
                  children: [
                    TextSpan(
                      text: 'DANE',
                      style: TextStyle(
                        color: kText,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 3,
                      ),
                    ),
                    TextSpan(
                      text: '.',
                      style: TextStyle(
                        color: kAccent,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              if (!compact)
                Row(
                  children: [
                    _footerLink('Twitter'),
                    const SizedBox(width: 28),
                    _footerLink('Instagram'),
                    const SizedBox(width: 28),
                    _footerLink('LinkedIn'),
                    const SizedBox(width: 28),
                    _footerLink('Dribbble'),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 40),
          const Divider(color: kBorder, height: 1),
          const SizedBox(height: 28),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '© 2026 Dane Design Studio. All rights reserved.',
                style: TextStyle(color: kMuted, fontSize: 12),
              ),
              if (!compact)
                const Text(
                  'Designed & built with care.',
                  style: TextStyle(color: kMuted, fontSize: 12),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _footerLink(String label) {
    return Text(
      label,
      style: const TextStyle(
        color: kMuted,
        fontSize: 13,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}

// ─── Shared widgets ───────────────────────────────────────────────────────────
class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        border: Border.all(color: kBorder),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          color: kMuted,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 2,
        ),
      ),
    );
  }
}
