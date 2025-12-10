import { ArrowLeft, Database, GitBranch, Table2, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function InfoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-4 px-6 py-4 bg-card border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-primary">Ressou Merize</h1>
            <span className="text-sm font-semibold text-foreground">À propos</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          La Méthode Merise
        </h1>

        <section className="space-y-6 text-foreground/90">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Qu'est-ce que Merise ?
            </h2>
            <p className="leading-relaxed">
              <strong>Merise</strong> est une méthode française de conception de systèmes d'information, 
              créée dans les années 1970. Elle est particulièrement adaptée à la modélisation des bases 
              de données relationnelles et se distingue par son approche en trois niveaux d'abstraction.
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Les trois niveaux de modélisation
            </h2>
            
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  1. MCD - Modèle Conceptuel de Données
                </h3>
                <p className="text-foreground/80">
                  Le MCD représente les données de manière abstraite, indépendamment de toute 
                  implémentation technique. Il décrit les <strong>entités</strong> (objets du monde réel), 
                  leurs <strong>attributs</strong> (propriétés) et les <strong>relations</strong> (associations) 
                  entre elles, avec leurs <strong>cardinalités</strong> (0,1 / 1,1 / 0,n / 1,n).
                </p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  2. MLD - Modèle Logique de Données
                </h3>
                <p className="text-foreground/80">
                  Le MLD transforme le MCD en un schéma adapté au modèle relationnel. Les entités 
                  deviennent des <strong>tables</strong>, les attributs deviennent des <strong>colonnes</strong>, 
                  et les relations sont traduites en <strong>clés étrangères</strong>. Les relations N-M 
                  créent des <strong>tables de jonction</strong>.
                </p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  3. MPD - Modèle Physique de Données
                </h3>
                <p className="text-foreground/80">
                  Le MPD est l'implémentation concrète du MLD pour un SGBD spécifique (MySQL, MariaDB, 
                  PostgreSQL...). Il définit les <strong>types de données précis</strong>, les 
                  <strong>contraintes</strong>, les <strong>index</strong> et génère le code SQL.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <Table2 className="w-5 h-5" />
              Les cardinalités
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded-lg p-3">
                <span className="font-mono font-bold text-primary">0,1</span>
                <p className="text-sm text-foreground/80">Zéro ou un (optionnel)</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <span className="font-mono font-bold text-primary">1,1</span>
                <p className="text-sm text-foreground/80">Exactement un (obligatoire)</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <span className="font-mono font-bold text-primary">0,n</span>
                <p className="text-sm text-foreground/80">Zéro ou plusieurs (optionnel)</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <span className="font-mono font-bold text-primary">1,n</span>
                <p className="text-sm text-foreground/80">Un ou plusieurs (obligatoire)</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Utilisation de Ressou Merize
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-foreground/80">
              <li>Créez vos entités et définissez leurs attributs dans le <strong>MCD</strong></li>
              <li>Établissez les relations entre entités avec les verbes et cardinalités appropriés</li>
              <li>Visualisez la transformation automatique en <strong>MLD</strong></li>
              <li>Consultez le <strong>MPD</strong> et générez le code SQL pour votre SGBD</li>
              <li>Exportez vos modèles en images et téléchargez le fichier SQL</li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}
