import { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Mail, Heart, ExternalLink } from 'lucide-react';

interface FooterLink {
  label: string;
  url: string;
}

interface SocialLink {
  type: string;
  url: string;
}

const socialIcons: Record<string, React.ReactNode> = {
  github: <Github className="w-5 h-5" />,
  twitter: <Twitter className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  email: <Mail className="w-5 h-5" />,
};

export function Footer() {
  const [footerText] = useState('MERISE FORGE © 2026 - Conçu par PAGUERA');
  const [footerLinks] = useState<FooterLink[]>([]);
  const [socialLinks] = useState<SocialLink[]>([]);

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="relative z-10 border-t border-border/50 bg-gradient-to-b from-background to-muted/30"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Links Section */}
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {footerLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                {link.label}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              {footerText.includes('❤') ? (
                footerText
              ) : (
                <>
                  {footerText.replace('©', '')}
                  <Heart className="w-3 h-3 text-red-500 fill-red-500 mx-1" />
                </>
              )}
            </p>
          </div>

          {/* Social Links */}
          <div className="flex gap-3 justify-center md:justify-end">
            {socialLinks.map((social, index) => (
              <motion.a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-muted/50 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                {socialIcons[social.type] || <ExternalLink className="w-5 h-5" />}
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative gradient line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </motion.footer>
  );
}
