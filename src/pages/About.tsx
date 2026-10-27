import { Link } from 'react-router-dom'

export default function About() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-6">
      <h1 className="font-display text-3xl font-bold">Sobre</h1>
      <p>
        Não Pode é um projeto independente e gratuito, feito por diversão. Não tem ligação com a
        Party Games nem com o jogo de tabuleiro comercial de nome parecido.
      </p>
      <p>
        As regras são as de um clássico jogo de palavras proibidas. Todas as palavras e cartas foram
        criadas originalmente para este site.
      </p>
      <p>
        Não coletamos dados: sem login, sem anúncios e sem servidor. A partida fica salva só no seu
        aparelho.
      </p>
      <Link
        to="/"
        className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-white/10 font-bold"
      >
        Voltar
      </Link>
    </main>
  )
}
