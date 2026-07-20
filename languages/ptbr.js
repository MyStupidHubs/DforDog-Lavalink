module.exports = {
    meta: {
        name: "Português (Brasil)",
        code: "ptbr"
    },
    help: {
        command: {
            name: "help",
            description: "Veja informações sobre o bot e seus comandos",
            category: {
                name: "category",
                description: "Selecione uma categoria para visualizar",
                choices: {
                    main: "🏠 Menu Principal",
                    music: "🎵 Comandos de Música",
                    playlist: "📋 Comandos de Playlists",
                    basic: "💜 Comandos Básicos",
                    utility: "🔧 Comandos Utilitários"
                }
            }
        },
        categories: {
            main: {
                name: "Menu Principal",
                emoji: "🏠",
                description: "Bem-vindo ao menu de ajuda"
            },
            music: {
                name: "Comandos de Música",
                emoji: "🎵",
                description: "Controle a reprodução e as configurações de música"
            },
            playlist: {
                name: "Comandos de Playlists",
                emoji: "📋",
                description: "Gerencie suas playlists"
            },
            basic: {
                name: "Comandos Básicos",
                emoji: "⚙️",
                description: "Informações gerais e utilitários do bot"
            },
            utility: {
                name: "Comandos Utilitários",
                emoji: "🔧",
                description: "Recursos utilitários adicionais"
            }
        },
        mainMenu: {
            header: {
                title: "# 🎵 Menu de Ajuda do {botName}",
                welcome: "**Bem-vindo ao {botName}!**",
                subtitle: "Seu companheiro musical definitivo no Discord."
            },
            statistics: {
                title: "## Estatísticas",
                commands: "• **Comandos:** {totalCommands}",
                servers: "• **Servidores:** {totalServers}",
                users: "• **Usuários:** {totalUsers}",
                uptime: "• **Tempo online:** {uptimeString}",
                ping: "• **Ping:** {ping}ms"
            },
            categories: {
                title: "## 📂 Categorias Disponíveis",
                music: "{emoji} **{name}** - {count} comandos",
                playlist: "{emoji} **{name}** - {count} comandos",
                basic: "{emoji} **{name}** - {count} comandos",
                utility: "{emoji} **{name}** - {count} comandos",
                footer: "**Selecione uma categoria abaixo para ver os comandos detalhados.**"
            },
            footer: {
                version: "**Versão 1.4** • Prime Music Bot",
                developer: "Desenvolvido por GlaceYT / https://GlaceYT.com"
            },
            selectMenu: {
                placeholder: "📂 Selecione uma categoria para ver os comandos...",
                musicDescription: "{count} comandos disponíveis",
                playlistDescription: "{count} comandos disponíveis",
                basicDescription: "{count} comandos disponíveis",
                utilityDescription: "{count} comandos disponíveis"
            },
            buttons: {
                supportServer: "Servidor de Suporte",
                github: "GitHub"
            }
        },
        categoryPage: {
            noCommands: {
                title: "## ❌ Nenhum Comando Encontrado",
                message: "Não há comandos disponíveis na categoria **{categoryName}**.",
                backToHelp: "Use `/help` para voltar ao menu principal."
            },
            header: {
                title: "# {emoji} {categoryName}",
                description: "{description}",
                count: "**{count}** comando{plural} na categoria"
            },
            commands: {
                title: "## Comandos",
                titlePaginated: "## Comandos (Página {currentPage}/{totalPages})",
                item: "**{num}.** `/{commandName}`\n   {description}",
                noDescription: "Nenhuma descrição disponível."
            },
            footer: {
                version: "**Versão 1.4** • Prime Music Bot",
                developer: "Desenvolvido por GlaceYT / https://GlaceYT.com"
            },
            buttons: {
                backToMain: "🏠 Voltar ao Menu Principal",
                supportServer: "Servidor de Suporte",
                github: "GitHub"
            }
        },
        errors: {
            general: "❌ **Ocorreu um erro ao carregar o menu de ajuda.**",
            fallback: "❌ Ocorreu um erro ao carregar o menu de ajuda.",
            fallbackDetails: "**Bot:** {botName}\n**Comandos:** {totalCommands}\n**Servidores:** {totalServers}\n**Suporte:** {supportServer}"
        }
    },
    language: {
        command: {
            name: "language",
            description: "Defina o idioma do bot para este servidor",
            option: {
                name: "lang",
                description: "Selecione um idioma"
            }
        },
        current: {
            title: "🌐 Idioma Atual",
            description: "O idioma atual deste servidor é: **{language}**",
            global: "Padrão global (da configuração): **{language}**"
        },
        changed: {
            title: "✅ Idioma Alterado",
            description: "O idioma do servidor foi alterado para: **{language}**",
            note: "O bot agora usará este idioma em todos os comandos deste servidor."
        },
        available: {
            title: "📚 Idiomas Disponíveis",
            description: "Selecione um idioma na lista abaixo:",
            list: "**Idiomas Disponíveis:**\n{list}",
            item: "• **{name}** (`{code}`)"
        },
        errors: {
            notFound: "❌ **Idioma não encontrado!**\nO idioma `{code}` não existe.",
            failed: "❌ **Falha ao definir o idioma!**\n{error}",
            noPermission: "❌ **Você não tem permissão para alterar o idioma!**\nVocê precisa da permissão `Gerenciar Servidor`."
        },
        info: {
            title: "ℹ️ Informações do Idioma",
            description: "**Idioma Atual do Servidor:** {serverLang}\n**Padrão Global:** {globalLang}\n\n**Idiomas Disponíveis:** {count}",
            reset: "Para restaurar o padrão global, use `/language reset`"
        }
    },
    ping: {
        command: {
            name: "ping",
            description: "Verifique a latência e o tempo de resposta do bot"
        },
        header: {
            title: "# Latência do Bot",
            botName: "**{botName}** - Prime Music Bot",
            subtitle: "Verifique o tempo de resposta e o status da conexão do bot"
        },
        metrics: {
            title: "## Métricas de Desempenho",
            responseTime: "**Tempo de Resposta:** {latency}ms",
            websocketPing: "**Ping do WebSocket:** {ping}ms",
            botUptime: "**Tempo Online do Bot:** {uptime}",
            connectionSpeed: {
                excellent: "🟢 Velocidade de conexão excelente",
                good: "🟡 Velocidade de conexão boa",
                slow: "🔴 Velocidade de conexão lenta"
            }
        },
        footer: {
            version: "**Versão 1.4** • Prime Music Bot",
            developer: "Desenvolvido por GlaceYT / https://GlaceYT.com"
        },
        errors: {
            title: "## ❌ Erro",
            message: "Ocorreu um erro ao verificar a latência.\nTente novamente mais tarde.",
            fallback: "❌ Ocorreu um erro ao verificar a latência."
        }
    },
    stats: {
        command: {
            name: "stats",
            description: "Mostre as estatísticas do bot e informações do servidor"
        },
        header: {
            title: "# Estatísticas do Bot",
            botName: "**{botName}** - Prime Music Bot",
            developer: "Desenvolvido por GlaceYT / https://GlaceYT.com"
        },
        botInfo: {
            title: "## Informações do Bot",
            servers: "• **Servidores:** {count}",
            users: "• **Usuários:** {count}",
            channels: "• **Canais:** {count}",
            uptime: "• **Tempo online:** {uptime}"
        },
        musicStats: {
            title: "## Estatísticas de Música",
            activePlayers: "• **Players Ativos:** {count}",
            totalPlayers: "• **Total de Players:** {count}",
            currentTrack: "• **Faixa Atual:** {track}"
        },
        systemInfo: {
            title: "## Informações do Sistema",
            cpu: "• **CPU:** {cpu}",
            platform: "• **Plataforma:** {platform}",
            nodejs: "• **Node.js:** {version}",
            discordjs: "• **Discord.js:** {version}"
        },
        memory: {
            title: "## Memória e Desempenho",
            memoryUsage: "**Uso de Memória:**",
            used: "• Usado: {used}",
            total: "• Total: {total}",
            systemMemory: "**Memória do Sistema:**",
            systemUsed: "• Usado: {used}",
            systemFree: "• Livre: {free}",
            performance: "**Desempenho:**",
            ping: "• Ping: {ping}ms",
            shards: "• Shards: {count}",
            commands: "• Comandos: {count}"
        },
        footer: {
            version: "**Versão 1.4** • Prime Music Bot",
            developer: "Desenvolvido por GlaceYT / https://GlaceYT.com"
        },
        errors: {
            title: "## ❌ Erro",
            message: "Ocorreu um erro ao obter as estatísticas.\nTente novamente mais tarde.",
            fallback: "❌ Ocorreu um erro ao obter as estatísticas."
        }
    },
    support: {
        command: {
            name: "support",
            description: "Obtenha o link do servidor de suporte e outros links importantes"
        },
        header: {
            title: "# Suporte e Links",
            botName: "**{botName}** - Prime Music Bot",
            subtitle: "Obtenha ajuda, relate problemas ou fale com a gente!"
        },
        links: {
            title: "## Links Importantes",
            supportServer: {
                title: "**Servidor de Suporte**",
                description: "Entre no nosso servidor do Discord para receber ajuda, novidades e participar da comunidade!",
                link: "[Clique aqui para entrar]({url})"
            },
            github: {
                title: "**GitHub**",
                description: "Confira nosso código e contribua!",
                link: "[Visitar GitHub]({url})"
            },
            youtube: {
                title: "**YouTube**",
                description: "Assista a tutoriais e novidades!",
                link: "[Inscrever-se]({url})"
            },
            website: {
                title: "**Site**",
                description: "Visite nosso site oficial!",
                link: "[Visitar Site]({url})"
            }
        },
        footer: {
            version: "**Versão 1.4** • Prime Music Bot",
            developer: "Desenvolvido por GlaceYT / https://GlaceYT.com"
        },
        buttons: {
            supportServer: "Servidor de Suporte",
            github: "GitHub",
            youtube: "YouTube"
        },
        errors: {
            title: "## ❌ Erro",
            message: "Ocorreu um erro ao carregar as informações de suporte.\nTente novamente mais tarde.",
            fallback: "❌ Ocorreu um erro ao carregar as informações de suporte."
        }
    },
    music: {
        autoplay: {
            command: {
                name: "autoplay",
                description: "Ative ou desative a reprodução automática no servidor"
            },
            enabled: {
                title: "## ✅ Reprodução Automática Ativada",
                message: "A reprodução automática foi **ativada** neste servidor.",
                note: "🎵 O bot tocará automaticamente músicas semelhantes quando a fila terminar."
            },
            disabled: {
                title: "## ❌ Reprodução Automática Desativada",
                message: "A reprodução automática foi **desativada** neste servidor.",
                note: "⏹️ O bot parará de tocar quando a fila terminar."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao atualizar as configurações de reprodução automática.\nTente novamente mais tarde."
            }
        },
        pause: {
            command: {
                name: "pause",
                description: "Pause a música atual"
            },
            success: {
                title: "## ⏸️ Música Pausada",
                message: "A faixa atual foi pausada.",
                note: "Use `/resume` para continuar a reprodução."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao pausar a música.\nTente novamente mais tarde."
            }
        },
        resume: {
            command: {
                name: "resume",
                description: "Retome a música atual"
            },
            success: {
                title: "## ▶️ Música Retomada",
                message: "A faixa atual foi retomada.",
                note: "A música está tocando novamente."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao retomar a música.\nTente novamente mais tarde."
            }
        },
        skip: {
            command: {
                name: "skip",
                description: "Pule a música atual"
            },
            success: {
                title: "## ⏭️ Música Pulada",
                message: "A faixa atual foi pulada.",
                nextSong: "Tocando a próxima música da fila...",
                queueEmpty: "A fila está vazia."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao pular a música.\nTente novamente mais tarde."
            }
        },
        stop: {
            command: {
                name: "stop",
                description: "Pare a música atual e encerre o player"
            },
            success: {
                title: "## ⏹️ Música Parada",
                message24_7: "Música parada. O player foi mantido ativo (modo 24/7 ativado).",
                messageNormal: "A música foi parada e o player foi encerrado.",
                note: "Use `/play` para começar a tocar música novamente."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao parar a música.\nTente novamente mais tarde."
            }
        },
        volume: {
            command: {
                name: "volume",
                description: "Defina o volume da música atual"
            },
            invalid: {
                title: "## ❌ Volume Inválido",
                message: "O volume deve estar entre **0** e **100**.",
                note: "Informe um nível de volume válido."
            },
            success: {
                title: "## 🔊 Volume Atualizado",
                message: "O volume foi definido como **{volume}%**.",
                muted: "🔇 Mudo",
                low: "🔉 Baixo",
                medium: "🔊 Médio",
                high: "🔊🔊 Alto"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao definir o volume.\nTente novamente mais tarde."
            }
        },
        shuffle: {
            command: {
                name: "shuffle",
                description: "Embaralhe a fila de músicas atual"
            },
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Não há músicas para embaralhar.",
                note: "Adicione algumas músicas à fila usando `/play` primeiro."
            },
            success: {
                title: "## 🔀 Fila Embaralhada",
                message: "A fila foi embaralhada com sucesso!",
                count: "Total reorganizado: **{count}** música{plural}."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao embaralhar a fila.\nTente novamente mais tarde."
            }
        },
        np: {
            command: {
                name: "np",
                description: "Exiba a música em reprodução com uma barra de progresso"
            },
            title: "## Tocando Agora",
            nowPlaying: "**[{title}]({uri})**",
            by: "por **{author}**",
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao carregar a faixa atual.\nTente novamente mais tarde."
            }
        },
        queue: {
            command: {
                name: "queue",
                description: "Mostre a fila de músicas atual"
            },
            title: "## 📋 Fila Atual",
            titlePaginated: "## 📋 Fila Atual (Página {currentPage}/{totalPages})",
            nowPlaying: "🎵 **Tocando Agora:**",
            track: "[{title}]({uri})",
            requestedBy: "Solicitada por: {requester}",
            trackNumber: "**{number}.**",
            noMoreSongs: "Não há mais músicas",
            buttons: {
                previous: "Anterior",
                next: "Próxima"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao carregar a fila.\nTente novamente mais tarde."
            }
        },
        remove: {
            command: {
                name: "remove",
                description: "Remova uma música da fila pela posição"
            },
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Não há músicas para remover.",
                note: "Adicione algumas músicas à fila usando `/play` primeiro."
            },
            invalidPosition: {
                title: "## ❌ Posição Inválida",
                message: "A posição deve estar entre **1** e **{max}**.",
                note: "A fila tem **{count}** música{plural}."
            },
            success: {
                title: "## ✅ Música Removida",
                removed: "**Removida:** [{title}]({uri})",
                position: "**Posição:** {position}",
                message: "A música foi removida da fila."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao remover a música.\nTente novamente mais tarde."
            }
        },
        move: {
            command: {
                name: "move",
                description: "Mova uma faixa para outra posição na fila"
            },
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Não há músicas para mover.",
                note: "Adicione algumas músicas à fila usando `/play` primeiro."
            },
            invalidPosition: {
                title: "## ❌ Posição Inválida",
                message: "A posição deve estar entre **1** e **{max}**.",
                note: "A fila tem **{count}** música{plural}."
            },
            samePosition: {
                title: "## ❌ Mesma Posição",
                message: "As posições de origem e destino não podem ser iguais.",
                note: "Informe posições diferentes."
            },
            success: {
                title: "## ✅ Faixa Movida",
                track: "**Faixa:** [{title}]({uri})",
                from: "**Da posição:** {from}",
                to: "**Para a posição:** {to}",
                message: "A faixa foi movida com sucesso."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao mover a faixa.\nTente novamente mais tarde."
            }
        },
        jump: {
            command: {
                name: "jump",
                description: "Pule diretamente para uma faixa específica da fila"
            },
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Não há músicas para selecionar.",
                note: "Adicione algumas músicas à fila usando `/play` primeiro."
            },
            invalidPosition: {
                title: "## ❌ Posição Inválida",
                message: "A posição deve estar entre **1** e **{max}**.",
                note: "A fila tem **{count}** música{plural}."
            },
            success: {
                title: "## ⏭️ Faixa Selecionada",
                track: "**Faixa:** [{title}]({uri})",
                position: "**Posição:** {position}",
                message: "A reprodução avançou para a faixa especificada na fila."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao selecionar a faixa.\nTente novamente mais tarde."
            }
        },
        seek: {
            command: {
                name: "seek",
                description: "Avance para um tempo específico da faixa atual"
            },
            invalidTime: {
                title: "## ❌ Tempo Inválido",
                message: "Formato de tempo inválido. Use uma das opções abaixo:",
                formats: "• **MM:SS** (ex.: 1:30)\n• **HH:MM:SS** (ex.: 1:05:30)\n• **Segundos** (ex.: 90)",
                trackLength: "**Duração da faixa:** {length}"
            },
            success: {
                title: "## ⏩ Posição Alterada",
                time: "**Tempo:** {time}",
                track: "**Faixa:** [{title}]({uri})",
                message: "A reprodução avançou para o tempo especificado."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao alterar a posição da faixa.\nTente novamente mais tarde."
            }
        },
        trackinfo: {
            command: {
                name: "trackinfo",
                description: "Mostre informações detalhadas sobre a faixa atual"
            },
            trackInfo: {
                title: "## Informações da Faixa",
                titleLabel: "**Título:** [{title}]({uri})",
                artist: "**Artista:** {artist}",
                duration: "**Duração:** {duration}",
                source: "**Fonte:** {source}"
            },
            progress: {
                title: "## Progresso",
                current: "**Atual:** {current}",
                total: "**Total:** {total}",
                progress: "**Progresso:** {progress}%"
            },
            status: {
                title: "## 🎚️ Status do Player",
                volume: "**Volume:** {volume}%",
                loop: "**Repetição:** {loop}",
                status: "**Status:** {status}",
                queue: "**Fila:** {count} faixa{plural}"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao obter as informações da faixa.\nTente novamente mais tarde."
            }
        },
        voteskip: {
            command: {
                name: "voteskip",
                description: "Vote para pular a faixa atual"
            },
            alreadyVoted: {
                title: "## ❌ Voto Já Registrado",
                message: "Você já votou para pular esta faixa.",
                votes: "**Votos atuais:** {current}/{required}"
            },
            success: {
                title: "## ✅ Voto Adicionado",
                message: "Seu voto foi adicionado!",
                currentVotes: "**Votos atuais:** {current}/{required}",
                required: "**Necessário:** {required} votos para pular",
                moreNeeded: "{count} voto{plural} restante(s)."
            },
            skipped: {
                title: "## ⏭️ Faixa Pulada por Votação",
                message: "A faixa foi pulada!",
                votes: "**Votos:** {current}/{required}",
                required: "**Necessário:** {required} votos"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao processar o voto.\nTente novamente mais tarde."
            }
        },
        filters: {
            command: {
                name: "filters",
                description: "Controle os filtros de áudio"
            },
            cleared: {
                title: "## ✅ Filtros Removidos",
                message: "Todos os filtros de áudio foram removidos.",
                note: "O áudio voltou ao normal."
            },
            invalid: {
                title: "## ❌ Filtro Inválido",
                message: "O filtro selecionado é inválido.",
                note: "Selecione um filtro válido entre as opções."
            },
            success: {
                title: "## 🎛️ Filtro Aplicado",
                filter: "**Filtro:** {filter}",
                message: "O filtro de áudio foi aplicado com sucesso.",
                note: "Use `/filters clear` para remover todos os filtros."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao aplicar o filtro.\nTente novamente mais tarde."
            }
        },
        play: {
            command: {
                name: "play",
                description: "Toque uma música pelo nome ou link"
            },
            lavalinkManagerError: {
                title: "## ❌ Erro no Gerenciador Lavalink",
                message: "O gerenciador de nós do Lavalink não foi inicializado.",
                note: "Entre em contato com o administrador do bot."
            },
            noNodes: {
                title: "## ❌ Nenhum Nó Lavalink",
                message: "Nenhum nó Lavalink está disponível no momento ({connected}/{total} conectados).",
                note: "O bot está tentando se reconectar. Tente novamente em instantes."
            },
            spotifyError: {
                title: "## ❌ Erro do Spotify",
                message: "Falha ao obter os dados do Spotify.",
                note: "Verifique o link e tente novamente."
            },
            invalidResponse: {
                title: "## ❌ Resposta Inválida",
                message: "A fonte de música retornou uma resposta inválida.",
                note: "Tente novamente ou use outra busca."
            },
            noResults: {
                title: "## ❌ Nenhum Resultado",
                message: "Nenhum resultado foi encontrado para sua busca.",
                note: "Tente outro termo de busca ou link."
            },
            success: {
                titleTrack: "## ✅ Faixa Adicionada",
                titlePlaylist: "## ✅ Playlist Adicionada",
                trackAdded: "A faixa foi adicionada à fila.",
                playlistAdded: "**{count}** faixas foram adicionadas à fila.",
                nowPlaying: "🎵 Tocando agora...",
                queueReady: "⏸️ Fila pronta"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao processar a solicitação.\nTente novamente mais tarde."
            }
        },
        search: {
            command: {
                name: "search",
                description: "Pesquise uma música e selecione nos resultados"
            },
            lavalinkManagerError: {
                title: "## ❌ Erro no Gerenciador Lavalink",
                message: "O gerenciador de nós do Lavalink não foi inicializado.",
                note: "Entre em contato com o administrador do bot."
            },
            noNodes: {
                title: "## ❌ Nenhum Nó Lavalink",
                message: "Nenhum nó Lavalink está disponível no momento ({connected}/{total} conectados).",
                note: "O bot está tentando se reconectar. Tente novamente em instantes."
            },
            noResults: {
                title: "## ❌ Nenhum Resultado",
                message: "Nenhum resultado foi encontrado para sua busca.",
                note: "Tente outro termo de busca."
            },
            playlistNotSupported: {
                title: "## ❌ Playlists Não São Compatíveis",
                message: "Playlists não são compatíveis com a pesquisa.",
                note: "Use o comando `/play` para reproduzir playlists."
            },
            results: {
                title: "## 🔍 Resultados da Pesquisa",
                query: "**Busca:** {query}",
                track: "**{number}.** [{title}]({uri})\n   └ {author} • {duration}"
            },
            buttons: {
                cancel: "Cancelar"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro durante a pesquisa.\nTente novamente mais tarde."
            }
        }
    },
    playlist: {
        playlist: {
            command: {
                name: "playlist",
                description: "Abra o menu de playlists"
            },
            title: "Menu de Playlists",
            description: "Gerencie suas playlists usando os botões abaixo.",
            createLabel: "Criar",
            createDescription: "Abra o formulário de nome e salve uma nova playlist.",
            addLabel: "Adicionar",
            addDescription: "Adicione músicas ou URLs separadas por vírgulas a uma de suas playlists.",
            viewLabel: "Visualizar",
            viewDescription: "Abra suas playlists e escolha uma para visualizar.",
            playLabel: "Reproduzir",
            playDescription: "Abra suas playlists e escolha uma para reproduzir.",
            viewSongsLabel: "Ver Músicas",
            viewSongsDescription: "Navegue pelas músicas de uma de suas playlists.",
            deleteLabel: "Excluir",
            deleteDescription: "Remova uma playlist da sua biblioteca pessoal.",
            noPlaylistsTitle: "## ❌ Nenhuma playlist encontrada",
            noPlaylistsMessage: "Você ainda não tem playlists. Crie a primeira usando **Criar Playlist**.",
            noPlaylistsNote: "Use o botão Criar Playlist para começar.",
            selectionPrompt: "Escolha uma playlist nos botões abaixo.",
            addPrompt: "Escolha uma playlist para adicionar músicas.",
            playPrompt: "Escolha uma playlist para reproduzir.",
            songsPrompt: "Escolha uma playlist para ver suas músicas.",
            deletePrompt: "Escolha uma playlist para excluir.",
            listStatus: "Exibindo {shown} de {filtered} playlists filtradas ({total} no total).",
            listLimitNote: "Somente as primeiras {max} playlists são exibidas aqui. Exclua ou renomeie playlists antigas para ver mais.",
            pageStatus: "Página {current}/{total}",
            noFilteredPlaylists: "Nenhuma playlist corresponde a este filtro. Tente outro intervalo ou escolha Todas.",
            allFilterLabel: "Todas",
            filterNumbersLabel: "0-9",
            filterAFLabel: "A-F",
            filterGLLabel: "G-L",
            filterMRLabel: "M-R",
            filterSZLabel: "S-Z",
            processingTitle: "Processando Playlist",
            processingMessage: "Preparando a playlist **{name}** e localizando as faixas. Aguarde...",
            createModalTitle: "Criar Playlist",
            playlistNameLabel: "Nome da Playlist",
            playlistNamePlaceholder: "Minhas músicas favoritas",
            addSongsModalTitle: "Adicionar Músicas a {name}",
            songsInputLabel: "Músicas ou URLs (separadas por vírgulas)",
            songsInputPlaceholder: "música 1, música 2, https://youtu.be/xyz",
            invalidPlaylistNameTitle: "## ❌ Nome de playlist inválido",
            invalidPlaylistNameMessage: "Informe um nome de playlist válido.",
            playlistExistsTitle: "## ❌ A playlist já existe",
            playlistExistsMessage: "Uma playlist chamada **\"{name}\"** já existe na sua biblioteca.",
            playlistCreatedTitle: "## ✅ Playlist Criada",
            playlistCreatedMessage: "Sua playlist **\"{name}\"** foi criada com sucesso.",
            noSongsFoundTitle: "## ❌ Nenhuma música encontrada",
            noSongsFoundMessage: "Adicione um ou mais nomes de músicas ou URLs separados por vírgulas.",
            playlistNotFoundTitle: "## ❌ Playlist não encontrada",
            playlistNotFoundMessage: "Essa playlist não foi encontrada ou pode ter sido excluída.",
            songsAddedTitle: "## ✅ Músicas Adicionadas",
            songsAddedMessage: "Foram adicionadas **{count}** música(s) à playlist **\"{name}\"**.",
            emptyPlaylistTitle: "## ❌ Playlist Vazia",
            emptyPlaylistMessage: "A playlist **\"{name}\"** ainda não tem músicas. Adicione músicas primeiro.",
            songsViewTitle: "Músicas da Playlist",
            songsViewStatus: "Exibindo músicas {start}-{end} de {total}.",
            songsEmptyTitle: "## ❌ Nenhuma música na playlist",
            songsEmptyMessage: "A playlist **\"{name}\"** ainda não tem músicas.",
            backToPlaylistsLabel: "Voltar às Playlists",
            voiceChannelErrorTitle: "## ❌ Erro no canal de voz",
            voiceChannelErrorMessage: "Não foi possível entrar no seu canal de voz.",
            lavalinkUnavailableTitle: "## ❌ Lavalink indisponível",
            lavalinkUnavailableMessage: "O gerenciador de música não está disponível agora. Tente novamente mais tarde.",
            nodesUnavailableTitle: "## ❌ Lavalink indisponível",
            nodesUnavailableMessage: "Nenhum nó está disponível para reproduzir música agora. Tente novamente mais tarde.",
            playbackErrorTitle: "## ❌ Erro de reprodução",
            playbackErrorMessage: "Não foi possível localizar uma ou mais músicas da playlist. Verifique o conteúdo da playlist.",
            playingPlaylistTitle: "Reproduzindo Playlist",
            playingPlaylistLineStatus: "Foram adicionadas **{count}** música(s) à fila.",
            playlistDeletedTitle: "## ✅ Playlist Excluída",
            playlistDeletedMessage: "A playlist foi removida com sucesso.",
            backLabel: "Voltar ao Menu",
            addHeading: "Adicionar Músicas",
            viewHeading: "Ver Playlists",
            playHeading: "Ver Playlists",
            songsHeading: "Ver Músicas da Playlist",
            deleteHeading: "Excluir Playlists",
            deleteNote: "Clique no botão de uma playlist para excluí-la permanentemente."
        },
        createplaylist: {
            command: {
                name: "createplaylist",
                description: "Crie uma nova playlist"
            },
            alreadyExists: {
                title: "## ❌ A Playlist Já Existe",
                message: "Uma playlist com o nome **\"{name}\"** já existe.",
                note: "Escolha outro nome."
            },
            success: {
                title: "## ✅ Playlist Criada",
                message: "Sua playlist **\"{name}\"** foi criada com sucesso!",
                visibility: "**Visibilidade:** {visibility}",
                server: "**Servidor:** {server}",
                private: "🔒 Privada",
                public: "🌐 Pública"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao criar a playlist.\nTente novamente mais tarde."
            }
        },
        addsong: {
            command: {
                name: "addsong",
                description: "Adicione uma música a uma playlist"
            },
            notFound: {
                title: "## ❌ Playlist Não Encontrada",
                message: "A playlist **\"{name}\"** não existe.",
                note: "Verifique o nome da playlist e tente novamente."
            },
            accessDenied: {
                title: "## 🔒 Acesso Negado",
                message: "Você não tem permissão para modificar esta playlist.",
                note: "Somente o proprietário da playlist pode adicionar músicas."
            },
            success: {
                title: "## ✅ Música Adicionada",
                song: "**Música:** {song}",
                playlist: "**Playlist:** {playlist}",
                message: "A música foi adicionada à sua playlist com sucesso!"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao adicionar a música.\nTente novamente mais tarde."
            }
        },
        deleteplaylist: {
            command: {
                name: "deleteplaylist",
                description: "Exclua uma playlist"
            },
            notFound: {
                title: "## ❌ Playlist Não Encontrada",
                message: "A playlist **\"{name}\"** não existe.",
                note: "Verifique o nome da playlist e tente novamente."
            },
            accessDenied: {
                title: "## 🔒 Acesso Negado",
                message: "Você não tem permissão para excluir esta playlist.",
                note: "Somente o proprietário da playlist pode excluí-la."
            },
            success: {
                title: "## ✅ Playlist Excluída",
                message: "A playlist **\"{name}\"** foi excluída com sucesso."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao excluir a playlist.\nTente novamente mais tarde."
            }
        },
        deletesong: {
            command: {
                name: "deletesong",
                description: "Exclua uma música de uma playlist"
            },
            notFound: {
                title: "## ❌ Playlist Não Encontrada",
                message: "A playlist **\"{name}\"** não existe.",
                note: "Verifique o nome da playlist e tente novamente."
            },
            success: {
                title: "## ✅ Música Excluída",
                song: "**Música:** {song}",
                playlist: "**Playlist:** {playlist}",
                message: "A música foi removida da sua playlist com sucesso."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao excluir a música.\nTente novamente mais tarde."
            }
        },
        savequeue: {
            command: {
                name: "savequeue",
                description: "Salve a fila atual como uma playlist"
            },
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Não há nada para salvar.",
                note: "Adicione algumas músicas à fila primeiro!"
            },
            alreadyExists: {
                title: "## ❌ A Playlist Já Existe",
                message: "Uma playlist chamada **\"{name}\"** já existe.",
                note: "Escolha outro nome."
            },
            success: {
                title: "## ✅ Fila Salva!",
                message: "Fila salva como a playlist **\"{name}\"**",
                tracks: "**Faixas:** {count}"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao salvar a fila.\nTente novamente mais tarde."
            }
        },
        myplaylists: {
            command: {
                name: "myplaylists",
                description: "Liste todas as playlists que você criou"
            },
            noPlaylists: {
                title: "## 📋 Nenhuma Playlist Encontrada",
                message: "Você ainda não criou nenhuma playlist.",
                note: "Use `/createplaylist` para criar sua primeira playlist!"
            },
            title: "## 📂 Suas Playlists (Página {currentPage}/{totalPages})",
            playlistItem: "**{number}.** **{name}**\n   • Visibilidade: **{visibility}**\n   • Servidor: {server}\n   • Músicas: **{count}**",
            visibilityPrivate: "🔒 Privada",
            visibilityPublic: "🌐 Pública",
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao carregar suas playlists.\nTente novamente mais tarde."
            }
        },
        allplaylists: {
            command: {
                name: "allplaylists",
                description: "Liste todas as playlists públicas"
            },
            noPlaylists: {
                title: "## 📋 Nenhuma Playlist Pública Encontrada",
                message: "Não há playlists públicas disponíveis.",
                note: "Crie uma playlist pública usando `/createplaylist`!"
            },
            title: "## 🌐 Playlists Públicas (Página {currentPage}/{totalPages})",
            playlistItem: "**{number}.** **{name}**\n   • Criada por: {creator}\n   • Servidor: {server}\n   • Músicas: **{count}**",
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao carregar as playlists públicas.\nTente novamente mais tarde."
            }
        },
        showsongs: {
            command: {
                name: "showsongs",
                description: "Mostre todas as músicas de uma playlist"
            },
            notFound: {
                title: "## ❌ Playlist Não Encontrada",
                message: "A playlist **\"{name}\"** não existe.",
                note: "Verifique o nome da playlist e tente novamente."
            },
            accessDenied: {
                title: "## 🔒 Acesso Negado",
                message: "Você não tem permissão para visualizar esta playlist.",
                note: "Esta playlist é privada e somente o proprietário pode visualizá-la."
            },
            empty: {
                title: "## 📋 Músicas de \"{name}\"",
                message: "Esta playlist está vazia. Adicione músicas usando `/addsong`!"
            },
            title: "## Músicas de \"{name}\" (Página {currentPage}/{totalPages})",
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao exibir as músicas da playlist.\nTente novamente mais tarde."
            }
        },
        playcustomplaylist: {
            command: {
                name: "playcustomplaylist",
                description: "Reproduza uma playlist personalizada"
            },
            notFound: {
                title: "## ❌ Playlist Não Encontrada",
                message: "A playlist **\"{name}\"** não existe.",
                note: "Verifique o nome da playlist e tente novamente."
            },
            accessDenied: {
                title: "## 🔒 Acesso Negado",
                message: "Você não tem permissão para reproduzir esta playlist.",
                note: "Esta playlist é privada e somente o proprietário pode reproduzi-la."
            },
            empty: {
                title: "## ❌ Playlist Vazia",
                message: "A playlist **\"{name}\"** está vazia.",
                note: "Adicione algumas músicas à playlist primeiro!"
            },
            lavalinkManagerError: {
                title: "## ❌ Erro no Gerenciador Lavalink",
                message: "O gerenciador de nós do Lavalink não foi inicializado.",
                note: "Entre em contato com o administrador do bot."
            },
            noNodes: {
                title: "## ❌ Nenhum Nó Lavalink",
                message: "Nenhum nó Lavalink está disponível no momento ({connected}/{total} conectados).",
                note: "O bot está tentando se reconectar. Tente novamente em instantes."
            },
            resolveError: {
                title: "## ❌ Erro ao Localizar Música",
                message: "Não foi possível localizar uma ou mais músicas da playlist.",
                note: "Verifique a playlist e tente novamente."
            },
            success: {
                title: "## Reproduzindo Playlist",
                message: "Reproduzindo agora a playlist **\"{name}\"**",
                songs: "**Músicas:** {count}"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao reproduzir a playlist.\nTente novamente mais tarde."
            }
        }
    },
    utility: {
        twentyfourseven: {
            command: {
                name: "247",
                description: "Ative ou desative o modo 24/7 (mantenha o bot no canal de voz)"
            },
            accessDenied: {
                title: "## ❌ Acesso Negado",
                message: "Somente o proprietário do servidor pode alterar o modo 24/7."
            },
            enabled: {
                title: "## ✅ Modo 24/7 Ativado",
                message: "O modo 24/7 foi **ativado** neste servidor.",
                note: "🔄 O bot permanecerá no canal de voz mesmo quando a fila estiver vazia."
            },
            disabled: {
                title: "## ❌ Modo 24/7 Desativado",
                message: "O modo 24/7 foi **desativado** neste servidor.",
                note: "⏹️ O bot sairá do canal de voz quando a fila terminar."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao atualizar o modo 24/7.",
                note: "Tente novamente mais tarde."
            }
        },
        history: {
            command: {
                name: "history",
                description: "Mostre as faixas reproduzidas recentemente"
            },
            noHistory: {
                title: "## 📜 Nenhum Histórico Encontrado",
                message: "Nenhum histórico de reprodução foi encontrado neste servidor.",
                note: "Reproduza algumas músicas para criar seu histórico!"
            },
            title: "## 📜 Histórico de Reprodução",
            titlePaginated: "## 📜 Histórico de Reprodução (Página {currentPage}/{totalPages})",
            noMoreSongs: "- Não há mais músicas no histórico.",
            buttons: {
                previous: "Anterior",
                next: "Próxima"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao obter o histórico.",
                note: "Tente novamente mais tarde."
            }
        }
    },
    events: {
        interactionCreate: {
            noGuild: "❌ **Este comando só pode ser usado em um servidor.**",
            commandNotFound: "❌ **Comando não encontrado!**",
            noPermission: "❌ **Você não tem permissão para usar este comando.**",
            errorOccurred: "❌ **Ocorreu um erro: {message}**",
            unexpectedError: "❌ **Ocorreu um erro inesperado. Tente novamente mais tarde.**",
            errorTryAgain: "❌ Ocorreu um erro. Tente novamente."
        }
    },
    utils: {
        voiceChannelCheck: {
            noVoiceChannel: {
                title: "## ❌ Nenhum Canal de Voz",
                message: "Você precisa estar em um canal de voz para usar este comando.",
                note: "Entre em um canal de voz e tente novamente."
            },
            wrongChannel: {
                title: "## Entre no Canal de Voz",
                message: "O bot está ativo no canal **{channelName}**.",
                note: "Entre em **{channelName}** para usar os comandos de música."
            }
        },
        playerValidation: {
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Não há músicas disponíveis.",
                note: "Adicione algumas músicas à fila usando `/play` primeiro."
            },
            noSongPlaying: {
                title: "## ❌ Nenhuma Música Tocando",
                message: "Nenhuma música está tocando no momento.",
                note: "Use `/play` para começar a tocar música."
            },
            noMusicPlaying: {
                title: "## ❌ Nenhuma Música em Reprodução",
                message: "Não há música tocando no momento e a fila está vazia.",
                note: "Use `/play` para começar a tocar música."
            }
        },
        responseHandler: {
            defaultError: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao processar o comando.",
                note: "Tente novamente mais tarde."
            },
            commandError: "❌ Ocorreu um erro ao processar o comando {commandName}."
        }
    },
    console: {
        bot: {
            clientLogged: "Cliente conectado como {tag}",
            musicSystemReady: "Sistema de Música Riffy Pronto 🎵",
            lavalinkError: "Erro ao inicializar o player: {message}",
            nodeManagerStatus: "Gerenciador de Nós: {available}/{total} nós disponíveis",
            nodeStatus: "Status dos Nós:",
            nodeInfo: "{icon} {name} ({host}:{port}) - {status}{error}",
            commandsLoaded: "Total de Comandos Carregados: {count}",
            commandLoadFailed: "Falha ao carregar: {name} - dados ou propriedade `run` ausentes",
            commandLoadError: "Erro ao carregar {name}: {message}",
            tokenVerification: "🔐 VERIFICAÇÃO DO TOKEN",
            tokenAuthFailed: "Falha na Autenticação ❌",
            tokenError: "Erro: ative as Intents ou redefina o token",
            databaseOnline: "MongoDB Online ✅",
            databaseStatus: "🕸️  STATUS DO BANCO DE DADOS",
            databaseConnection: "🕸️  CONEXÃO COM O BANCO DE DADOS",
            databaseFailed: "Falha na Conexão ❌",
            databaseError: "Erro: {message}",
            unhandledRejection: "Rejeição Não Tratada:",
            uncaughtException: "Exceção Não Capturada:",
            riffyThumbnailError: "[ Riffy ] Ignorando erro de miniatura: {message}"
        },
        events: {
            rest: {
                commandsRegistered: "{count} comandos de aplicativo (/) registrados globalmente com sucesso ✅",
                commandsFailed: "Falha ao registrar os comandos ❌",
                error: "Erro: {message}",
                details: "Detalhes: {details}"
            },
            interaction: {
                commandNotFound: "Comando não encontrado: {commandName}",
                errorExecuting: "Erro ao executar o comando {commandName}:",
                errorHelpButton: "Erro ao processar o botão de voltar da ajuda:",
                errorHelpSelect: "Erro ao processar a seleção de categoria da ajuda:",
                unexpectedError: "Erro inesperado:",
                failedToSendError: "Falha ao enviar a mensagem de erro:"
            }
        },
        mongodb: {
            uriNotDefined: "A URI do MongoDB não está definida na configuração.",
            skippingConnection: "Ignorando a conexão com o MongoDB porque nenhuma URI foi informada.",
            connected: "Conectado ao MongoDB ✅",
            connectionFailed: "Não foi possível conectar ao MongoDB. Continuando sem os recursos do banco de dados."
        },
        lavalink: {
            nodesConfigured: "Nós configurados: {count}",
            riffyInitialized: "Inicializado com {count} nó(s)",
            nodeKeys: "Chaves dos nós:",
            failedToInitialize: "Falha ao inicializar o Riffy: {message}",
            riffyReinitialized: "Riffy reinicializado",
            failedToReinitialize: "Falha ao reinicializar o Riffy: {message}",
            nodeConnected: "Conectado: {name} ({host}:{port}) • {available}/{total} ativos",
            nodeDisconnected: "Desconectado: {name} ({host}:{port}) • {available}/{total} ativos",
            retryLimitReported: "Limite de tentativas informado por {name}; o ciclo de reconexão continuará",
            nodeError: "Erro: {name} ({host}:{port}) • {message}",
            nodeStatus: "{available}/{total} ativos",
            waitingForConnection: "Aguardando conexão com o nó Lavalink...",
            nodeAvailable: "Nós conectados: {count}",
            noNodesConnected: "Nenhum nó conectado ({connected}/{total}) — tentando reconectar...",
            nodeStatusReport: "Status dos Nós: {connected}/{total} conectados"
        },
        player: {
            lacksPermissions: "O bot não tem as permissões necessárias para enviar mensagens neste canal.",
            errorSendingMessage: "Erro ao enviar a mensagem: {message}",
            trackException: "Exceção de faixa no servidor {guildId}: {message}",
            trackStuck: "Faixa travada no servidor {guildId}: {message}",
            trackNull: "A faixa é nula ou não possui informações no servidor {guildId} - ignorando o evento",
            playerInvalid: "Player inválido ou encerrado no servidor {guildId} - ignorando o evento",
            channelNotFound: "Canal não encontrado no servidor {guildId}",
            errorSavingHistory: "Erro ao salvar no histórico:",
            errorMusicCard: "Erro ao criar ou enviar o cartão da música: {message}",
            autoplayDisabled: "A reprodução automática está desativada no servidor: {guildId}",
            errorQueueEnd: "Erro ao processar o fim da fila:",
            errorCleanupPrevious: "Erro ao remover a mensagem da faixa anterior:",
            errorCleanupTrack: "Erro ao remover a mensagem da faixa:",
            lyricsFetchError: "❌ Erro ao buscar a letra: {message}",
            unableToSendMessage: {
                title: "## ⚠️ Não Foi Possível Enviar a Mensagem",
                message: "Não foi possível enviar a mensagem. Verifique as permissões do bot."
            },
            trackError: {
                title: "## ⚠️ Erro na Faixa",
                message: "Falha ao carregar a faixa.",
                skipping: "Pulando para a próxima música..."
            },
            unableToLoadCard: {
                title: "## ⚠️ Não Foi Possível Carregar o Cartão da Faixa",
                message: "Não foi possível carregar o cartão da faixa. A reprodução continuará..."
            },
            queueEnd: {
                noMoreAutoplay: "⚠️ **Não há mais faixas para reprodução automática. Desconectando...**",
                queueEndedAutoplayDisabled: "🎶 **A fila terminou. A reprodução automática está desativada.**",
                queueEmpty: "👾 **Fila Vazia! Desconectando...**",
                twentyfoursevenEmpty: "🔄 **Modo 24/7: o bot permanecerá no canal de voz. A fila está vazia.**"
            },
            voiceChannelRequired: {
                title: "## 🔒 Canal de Voz Necessário",
                message: "Você precisa estar no mesmo canal de voz para usar os controles!"
            },
            controls: {
                skip: "⏭️ **Pulando para a próxima música...**",
                queueCleared: "🗑️ **A fila foi limpa!**",
                playbackStopped: "⏹️ **A reprodução foi parada e o player foi encerrado!**",
                alreadyPaused: "⏸️ **A reprodução já está pausada!**",
                playbackPaused: "⏸️ **A reprodução foi pausada!**",
                alreadyResumed: "▶️ **A reprodução já foi retomada!**",
                playbackResumed: "▶️ **A reprodução foi retomada!**",
                volumeMax: "🔊 **O volume já está no máximo!**",
                volumeMin: "🔉 **O volume já está no mínimo!**",
                volumeChanged: "🔊 **Volume alterado para {volume}%!**",
                trackLoopActivated: "🔁 **A repetição da faixa foi ativada!**",
                queueLoopActivated: "🔁 **A repetição da fila foi ativada!**",
                loopDisabled: "❌ **A repetição foi desativada!**"
            },
            lyrics: {
                noSongPlaying: "🚫 **Nenhuma música está tocando no momento.**",
                notFound: "❌ **Letra não encontrada!**",
                liveTitle: "## Letra em Tempo Real: {title}",
                syncing: "🔄 Sincronizando a letra...",
                fullTitle: "## Letra Completa: {title}",
                stopButton: "Parar Letra",
                fullButton: "Letra Completa",
                deleteButton: "Excluir"
            },
            trackInfo: {
                title: "**Título:**",
                author: "**Autor:**",
                length: "**Duração:**",
                requester: "**Solicitante:**",
                source: "**Fonte:**",
                progress: "**Progresso:**",
                unknownArtist: "Artista Desconhecido",
                unknown: "Desconhecido"
            },
            controlLabels: {
                loop: "Repetição",
                disable: "Desativar",
                skip: "Pular",
                queue: "Fila",
                clear: "Limpar",
                stop: "Parar",
                pause: "Pausar",
                resume: "Retomar",
                volUp: "Vol +",
                volDown: "Vol -"
            }
        }
    }
};

