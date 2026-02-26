module.exports = {
    meta: {
        name: "Português (Brasil)",
        code: "pt_BR"
    },
    help: {
        command: {
            name: "help",
            description: "Obtenha informações sobre o bot e seus comandos",
            category: {
                name: "category",
                description: "Selecione uma categoria para visualizar",
                choices: {
                    main: "🏠 Menu Principal",
                    music: "🎵 Comandos de Música",
                    playlist: "📋 Comandos de Playlist",
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
                description: "Controle a reprodução e configurações de música"
            },
            playlist: {
                name: "Comandos de Playlist",
                emoji: "📋",
                description: "Gerencie suas playlists"
            },
            basic: {
                name: "Comandos Básicos",
                emoji: "⚙️",
                description: "Informações gerais e utilidades do bot"
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
                title: "## 📊 Estatísticas",
                commands: "• **Comandos:** {totalCommands}",
                servers: "• **Servidores:** {totalServers}",
                users: "• **Usuários:** {totalUsers}",
                uptime: "• **Tempo Ativo:** {uptimeString}",
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
                message: "Nenhum comando disponível na categoria **{categoryName}**.",
                backToHelp: "Use `/help` para voltar ao menu principal."
            },
            header: {
                title: "# {emoji} {categoryName}",
                description: "{description}",
                count: "**{count}** comando{plural} disponível(is)"
            },
            commands: {
                title: "## Comandos",
                titlePaginated: "## Comandos (Página {currentPage}/{totalPages})",
                item: "**{num}.** `/{commandName}`\n   {description}",
                noDescription: "Sem descrição disponível."
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
            description: "Definir o idioma do bot para este servidor",
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
            note: "O bot agora usará este idioma para todos os comandos neste servidor."
        },
        available: {
            title: "📚 Idiomas Disponíveis",
            description: "Selecione um idioma da lista abaixo:",
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
            description: "**Idioma Atual do Servidor:** {serverLang}\n**Idioma Padrão Global:** {globalLang}\n\n**Idiomas Disponíveis:** {count}",
            reset: "Para redefinir para o padrão global, use `/language reset`"
        }
    },
    ping: {
        command: {
            name: "ping",
            description: "Verificar a latência e o tempo de resposta do bot"
        },
        header: {
            title: "# 🏓 Latência do Bot",
            botName: "**{botName}** - Prime Music Bot",
            subtitle: "Verifique o tempo de resposta e o status da conexão do bot"
        },
        metrics: {
            title: "## ⚡ Métricas de Desempenho",
            responseTime: "**Tempo de Resposta:** {latency}ms",
            websocketPing: "**Ping do Websocket:** {ping}ms",
            botUptime: "**Tempo Ativo do Bot:** {uptime}",
            connectionSpeed: {
                excellent: "🟢 Velocidade de conexão excelente",
                good: "🟡 Boa velocidade de conexão",
                slow: "🔴 Velocidade de conexão lenta"
            }
        },
        footer: {
            version: "**Versão 1.4** • Prime Music Bot",
            developer: "Desenvolvido por GlaceYT / https://GlaceYT.com"
        },
        errors: {
            title: "## ❌ Erro",
            message: "Ocorreu um erro ao verificar a latência.\nPor favor, tente novamente mais tarde.",
            fallback: "❌ Ocorreu um erro ao verificar a latência."
        }
    },
    stats: {
        command: {
            name: "stats",
            description: "Mostrar estatísticas do bot e informações do servidor"
        },
        header: {
            title: "# 📊 Estatísticas do Bot",
            botName: "**{botName}** - Prime Music Bot",
            developer: "Desenvolvido por GlaceYT / https://GlaceYT.com"
        },
        botInfo: {
            title: "## 📊 Informações do Bot",
            servers: "• **Servidores:** {count}",
            users: "• **Usuários:** {count}",
            channels: "• **Canais:** {count}",
            uptime: "• **Tempo Ativo:** {uptime}"
        },
        musicStats: {
            title: "## 🎵 Estatísticas de Música",
            activePlayers: "• **Players Ativos:** {count}",
            totalPlayers: "• **Total de Players:** {count}",
            currentTrack: "• **Faixa Atual:** {track}"
        },
        systemInfo: {
            title: "## 💻 Informações do Sistema",
            cpu: "• **CPU:** {cpu}",
            platform: "• **Plataforma:** {platform}",
            nodejs: "• **Node.js:** {version}",
            discordjs: "• **Discord.js:** {version}"
        },
        memory: {
            title: "## 💾 Memória e Desempenho",
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
            message: "Ocorreu um erro ao recuperar as estatísticas.\nPor favor, tente novamente mais tarde.",
            fallback: "❌ Ocorreu um erro ao recuperar as estatísticas."
        }
    },
    support: {
        command: {
            name: "support",
            description: "Obter link do servidor de suporte e links importantes"
        },
        header: {
            title: "# 🆘 Suporte e Links",
            botName: "**{botName}** - Prime Music Bot",
            subtitle: "Obtenha ajuda, reporte problemas ou conecte-se conosco!"
        },
        links: {
            title: "## 🔗 Links Importantes",
            supportServer: {
                title: "**📢 Servidor de Suporte**",
                description: "Entre no nosso servidor do Discord para ajuda, atualizações e comunidade!",
                link: "[Clique aqui para entrar]({url})"
            },
            github: {
                title: "**💻 GitHub**",
                description: "Confira nosso código e contribua!",
                link: "[Visitar GitHub]({url})"
            },
            youtube: {
                title: "**🎬 YouTube**",
                description: "Assista tutoriais e atualizações!",
                link: "[Inscreva-se]({url})"
            },
            website: {
                title: "**🌐 Website**",
                description: "Visite nosso site oficial!",
                link: "[Visitar Website]({url})"
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
            message: "Ocorreu um erro ao buscar informações de suporte.\nPor favor, tente novamente mais tarde.",
            fallback: "❌ Ocorreu um erro ao buscar informações de suporte."
        }
    },
    music: {
        autoplay: {
            command: {
                name: "autoplay",
                description: "Ativar/desativar reprodução automática para o servidor"
            },
            enabled: {
                title: "## ✅ Reprodução Automática Ativada",
                message: "A reprodução automática foi **ativada** para este servidor.",
                note: "🎵 O bot tocará automaticamente músicas semelhantes quando a fila terminar."
            },
            disabled: {
                title: "## ❌ Reprodução Automática Desativada",
                message: "A reprodução automática foi **desativada** para este servidor.",
                note: "⏹️ O bot parará de tocar quando a fila terminar."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao atualizar as configurações de reprodução automática.\nPor favor, tente novamente mais tarde."
            }
        },
        pause: {
            command: {
                name: "pause",
                description: "Pausar a música atual"
            },
            success: {
                title: "## ⏸️ Música Pausada",
                message: "A faixa atual foi pausada.",
                note: "Use `/resume` para continuar tocando."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao pausar a música.\nPor favor, tente novamente mais tarde."
            }
        },
        resume: {
            command: {
                name: "resume",
                description: "Retomar a música atual"
            },
            success: {
                title: "## ▶️ Música Retomada",
                message: "A faixa atual foi retomada.",
                note: "A música está tocando agora."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao retomar a música.\nPor favor, tente novamente mais tarde."
            }
        },
        skip: {
            command: {
                name: "skip",
                description: "Pular a música atual"
            },
            success: {
                title: "## ⏭️ Música Pulada",
                message: "A faixa atual foi pulada.",
                nextSong: "Tocando a próxima música da fila...",
                queueEmpty: "A fila está vazia."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao pular a música.\nPor favor, tente novamente mais tarde."
            }
        },
        stop: {
            command: {
                name: "stop",
                description: "Parar a música atual e destruir o player"
            },
            success: {
                title: "## ⏹️ Música Parada",
                message24_7: "Música parada. Player mantido ativo (modo 24/7 ativado).",
                messageNormal: "A música foi parada e o player foi destruído.",
                note: "Use `/play` para começar a tocar música novamente."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao parar a música.\nPor favor, tente novamente mais tarde."
            }
        },
        volume: {
            command: {
                name: "volume",
                description: "Definir o volume da música atual"
            },
            invalid: {
                title: "## ❌ Volume Inválido",
                message: "O volume deve estar entre **0** e **100**.",
                note: "Por favor, forneça um nível de volume válido."
            },
            success: {
                title: "## 🔊 Volume Atualizado",
                message: "O volume foi definido para **{volume}%**.",
                muted: "🔇 Mudo",
                low: "🔉 Baixo",
                medium: "🔊 Médio",
                high: "🔊🔊 Alto"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao definir o volume.\nPor favor, tente novamente mais tarde."
            }
        },
        shuffle: {
            command: {
                name: "shuffle",
                description: "Embaralhar a fila de músicas atual"
            },
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Não há músicas para embaralhar.",
                note: "Adicione algumas músicas à fila primeiro usando `/play`."
            },
            success: {
                title: "## 🔀 Fila Embaralhada",
                message: "A fila foi embaralhada com sucesso!",
                count: "**{count}** música{plural} foram reorganizadas."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao embaralhar a fila.\nPor favor, tente novamente mais tarde."
            }
        },
        np: {
            command: {
                name: "np",
                description: "Exibe a música tocando atualmente com uma barra de progresso"
            },
            title: "## 🎵 Tocando Agora",
            nowPlaying: "**[{title}]({uri})**",
            by: "por **{author}**",
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao buscar a faixa atual.\nPor favor, tente novamente mais tarde."
            }
        },
        queue: {
            command: {
                name: "queue",
                description: "Mostrar a fila de músicas atual"
            },
            title: "## 📋 Fila Atual",
            titlePaginated: "## 📋 Fila Atual (Página {currentPage}/{totalPages})",
            nowPlaying: "🎵 **Tocando Agora:**",
            track: "[{title}]({uri})",
            requestedBy: "Solicitado por: {requester}",
            trackNumber: "**{number}.**",
            noMoreSongs: "Não há mais músicas",
            buttons: {
                previous: "⬅ Anterior",
                next: "Próximo ➡"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao buscar a fila.\nPor favor, tente novamente mais tarde."
            }
        },
        remove: {
            command: {
                name: "remove",
                description: "Remover uma música da fila pela sua posição"
            },
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Não há músicas para remover.",
                note: "Adicione algumas músicas à fila primeiro usando `/play`."
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
                message: "Ocorreu um erro ao remover a música.\nPor favor, tente novamente mais tarde."
            }
        },
        move: {
            command: {
                name: "move",
                description: "Mover uma faixa para uma posição diferente na fila"
            },
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Não há músicas para mover.",
                note: "Adicione algumas músicas à fila primeiro usando `/play`."
            },
            invalidPosition: {
                title: "## ❌ Posição Inválida",
                message: "A posição deve estar entre **1** e **{max}**.",
                note: "A fila tem **{count}** música{plural}."
            },
            samePosition: {
                title: "## ❌ Mesma Posição",
                message: "As posições de origem e destino não podem ser iguais.",
                note: "Por favor, forneça posições diferentes."
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
                message: "Ocorreu um erro ao mover a faixa.\nPor favor, tente novamente mais tarde."
            }
        },
        jump: {
            command: {
                name: "jump",
                description: "Pular para uma faixa específica na fila"
            },
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Não há músicas para pular.",
                note: "Adicione algumas músicas à fila primeiro usando `/play`."
            },
            invalidPosition: {
                title: "## ❌ Posição Inválida",
                message: "A posição deve estar entre **1** e **{max}**.",
                note: "A fila tem **{count}** música{plural}."
            },
            success: {
                title: "## ⏭️ Pulou para a Faixa",
                track: "**Faixa:** [{title}]({uri})",
                position: "**Posição:** {position}",
                message: "Pulou para a faixa especificada na fila."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao pular para a faixa.\nPor favor, tente novamente mais tarde."
            }
        },
        seek: {
            command: {
                name: "seek",
                description: "Avançar para um momento específico na faixa atual"
            },
            invalidTime: {
                title: "## ❌ Tempo Inválido",
                message: "Formato de tempo inválido. Use um dos seguintes:",
                formats: "• **MM:SS** (ex: 1:30)\n• **HH:MM:SS** (ex: 1:05:30)\n• **Segundos** (ex: 90)",
                trackLength: "**Duração da faixa:** {length}"
            },
            success: {
                title: "## ⏩ Avançado para a Posição",
                time: "**Tempo:** {time}",
                track: "**Faixa:** [{title}]({uri})",
                message: "A faixa foi avançada para o tempo especificado."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao avançar.\nPor favor, tente novamente mais tarde."
            }
        },
        trackinfo: {
            command: {
                name: "trackinfo",
                description: "Mostrar informações detalhadas sobre a faixa atual"
            },
            trackInfo: {
                title: "## 🎵 Informações da Faixa",
                titleLabel: "**Título:** [{title}]({uri})",
                artist: "**Artista:** {artist}",
                duration: "**Duração:** {duration}",
                source: "**Fonte:** {source}"
            },
            progress: {
                title: "## 📊 Progresso",
                current: "**Atual:** {current}",
                total: "**Total:** {total}",
                progress: "**Progresso:** {progress}%"
            },
            status: {
                title: "## 🎚️ Status do Player",
                volume: "**Volume:** {volume}%",
                loop: "**Loop:** {loop}",
                status: "**Status:** {status}",
                queue: "**Fila:** {count} faixa{plural}"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao recuperar as informações da faixa.\nPor favor, tente novamente mais tarde."
            }
        },
        voteskip: {
            command: {
                name: "voteskip",
                description: "Votar para pular a faixa atual"
            },
            alreadyVoted: {
                title: "## ❌ Já Votou",
                message: "Você já votou para pular esta faixa.",
                votes: "**Votos atuais:** {current}/{required}"
            },
            success: {
                title: "## ✅ Voto Registrado",
                message: "Seu voto foi registrado!",
                currentVotes: "**Votos atuais:** {current}/{required}",
                required: "**Necessários:** {required} votos para pular",
                moreNeeded: "Mais {count} voto{plural} necessário(s)."
            },
            skipped: {
                title: "## ⏭️ Faixa Pulada por Votação",
                message: "A faixa foi pulada!",
                votes: "**Votos:** {current}/{required}",
                required: "**Necessários:** {required} votos"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao processar o voto.\nPor favor, tente novamente mais tarde."
            }
        },
        filters: {
            command: {
                name: "filters",
                description: "Controlar filtros de áudio"
            },
            cleared: {
                title: "## ✅ Filtros Removidos",
                message: "Todos os filtros de áudio foram removidos.",
                note: "O áudio voltou ao normal."
            },
            invalid: {
                title: "## ❌ Filtro Inválido",
                message: "O filtro selecionado é inválido.",
                note: "Por favor, selecione um filtro válido das opções."
            },
            success: {
                title: "## 🎛️ Filtro Aplicado",
                filter: "**Filtro:** {filter}",
                message: "O filtro de áudio foi aplicado com sucesso.",
                note: "Use `/filters clear` para remover todos os filtros."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao aplicar o filtro.\nPor favor, tente novamente mais tarde."
            }
        },
        play: {
            command: {
                name: "play",
                description: "Tocar uma música a partir de um nome ou link"
            },
            lavalinkManagerError: {
                title: "## ❌ Erro do Gerenciador Lavalink",
                message: "O gerenciador de nós Lavalink não foi inicializado.",
                note: "Por favor, entre em contato com o administrador do bot."
            },
            noNodes: {
                title: "## ❌ Sem Nós Lavalink",
                message: "Nenhum nó Lavalink está disponível no momento ({connected}/{total} conectados).",
                note: "O bot está tentando reconectar. Por favor, tente novamente em instantes."
            },
            spotifyError: {
                title: "## ❌ Erro do Spotify",
                message: "Falha ao buscar dados do Spotify.",
                note: "Por favor, verifique o link e tente novamente."
            },
            invalidResponse: {
                title: "## ❌ Resposta Inválida",
                message: "Resposta inválida da fonte de música.",
                note: "Por favor, tente novamente ou use uma pesquisa diferente."
            },
            noResults: {
                title: "## ❌ Sem Resultados",
                message: "Nenhum resultado encontrado para sua pesquisa.",
                note: "Tente um termo de busca ou link diferente."
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
                message: "Ocorreu um erro ao processar a solicitação.\nPor favor, tente novamente mais tarde."
            }
        },
        search: {
            command: {
                name: "search",
                description: "Pesquisar uma música e selecionar dos resultados"
            },
            lavalinkManagerError: {
                title: "## ❌ Erro do Gerenciador Lavalink",
                message: "O gerenciador de nós Lavalink não foi inicializado.",
                note: "Por favor, entre em contato com o administrador do bot."
            },
            noNodes: {
                title: "## ❌ Sem Nós Lavalink",
                message: "Nenhum nó Lavalink está disponível no momento ({connected}/{total} conectados).",
                note: "O bot está tentando reconectar. Por favor, tente novamente em instantes."
            },
            noResults: {
                title: "## ❌ Sem Resultados",
                message: "Nenhum resultado encontrado para sua pesquisa.",
                note: "Tente um termo de busca diferente."
            },
            playlistNotSupported: {
                title: "## ❌ Playlists Não Suportadas",
                message: "Playlists não são suportadas na pesquisa.",
                note: "Use o comando `/play` para playlists."
            },
            results: {
                title: "## 🔍 Resultados da Pesquisa",
                query: "**Pesquisa:** {query}",
                track: "**{number}.** [{title}]({uri})\n   └ {author} • {duration}"
            },
            buttons: {
                cancel: "Cancelar"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao pesquisar.\nPor favor, tente novamente mais tarde."
            }
        }
    },
    playlist: {
        createplaylist: {
            command: {
                name: "createplaylist",
                description: "Criar uma nova playlist"
            },
            alreadyExists: {
                title: "## ❌ Playlist Já Existe",
                message: "Uma playlist com o nome **\"{name}\"** já existe.",
                note: "Por favor, escolha um nome diferente."
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
                message: "Ocorreu um erro ao criar a playlist.\nPor favor, tente novamente mais tarde."
            }
        },
        addsong: {
            command: {
                name: "addsong",
                description: "Adicionar uma música a uma playlist"
            },
            notFound: {
                title: "## ❌ Playlist Não Encontrada",
                message: "A playlist **\"{name}\"** não existe.",
                note: "Por favor, verifique o nome da playlist e tente novamente."
            },
            accessDenied: {
                title: "## 🔒 Acesso Negado",
                message: "Você não tem permissão para modificar esta playlist.",
                note: "Apenas o dono da playlist pode adicionar músicas."
            },
            success: {
                title: "## ✅ Música Adicionada",
                song: "**Música:** {song}",
                playlist: "**Playlist:** {playlist}",
                message: "A música foi adicionada à sua playlist com sucesso!"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao adicionar a música.\nPor favor, tente novamente mais tarde."
            }
        },
        deleteplaylist: {
            command: {
                name: "deleteplaylist",
                description: "Excluir uma playlist"
            },
            notFound: {
                title: "## ❌ Playlist Não Encontrada",
                message: "A playlist **\"{name}\"** não existe.",
                note: "Por favor, verifique o nome da playlist e tente novamente."
            },
            accessDenied: {
                title: "## 🔒 Acesso Negado",
                message: "Você não tem permissão para excluir esta playlist.",
                note: "Apenas o dono da playlist pode excluí-la."
            },
            success: {
                title: "## ✅ Playlist Excluída",
                message: "A playlist **\"{name}\"** foi excluída com sucesso."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao excluir a playlist.\nPor favor, tente novamente mais tarde."
            }
        },
        deletesong: {
            command: {
                name: "deletesong",
                description: "Excluir uma música de uma playlist"
            },
            notFound: {
                title: "## ❌ Playlist Não Encontrada",
                message: "A playlist **\"{name}\"** não existe.",
                note: "Por favor, verifique o nome da playlist e tente novamente."
            },
            success: {
                title: "## ✅ Música Excluída",
                song: "**Música:** {song}",
                playlist: "**Playlist:** {playlist}",
                message: "A música foi removida da sua playlist com sucesso."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao excluir a música.\nPor favor, tente novamente mais tarde."
            }
        },
        savequeue: {
            command: {
                name: "savequeue",
                description: "Salvar a fila atual como uma playlist"
            },
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Nada para salvar.",
                note: "Adicione algumas músicas à fila primeiro!"
            },
            alreadyExists: {
                title: "## ❌ Playlist Já Existe",
                message: "Uma playlist com o nome **\"{name}\"** já existe.",
                note: "Por favor, escolha um nome diferente."
            },
            success: {
                title: "## ✅ Fila Salva!",
                message: "Fila salva como playlist **\"{name}\"**",
                tracks: "**Faixas:** {count}"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao salvar a fila.\nPor favor, tente novamente mais tarde."
            }
        },
        myplaylists: {
            command: {
                name: "myplaylists",
                description: "Listar todas as playlists que você criou"
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
                message: "Ocorreu um erro ao buscar suas playlists.\nPor favor, tente novamente mais tarde."
            }
        },
        allplaylists: {
            command: {
                name: "allplaylists",
                description: "Listar todas as playlists públicas"
            },
            noPlaylists: {
                title: "## 📋 Nenhuma Playlist Pública Encontrada",
                message: "Não há playlists públicas disponíveis.",
                note: "Crie uma playlist pública usando `/createplaylist`!"
            },
            title: "## 🌐 Playlists Públicas (Página {currentPage}/{totalPages})",
            playlistItem: "**{number}.** **{name}**\n   • Criado por: {creator}\n   • Servidor: {server}\n   • Músicas: **{count}**",
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao buscar as playlists públicas.\nPor favor, tente novamente mais tarde."
            }
        },
        showsongs: {
            command: {
                name: "showsongs",
                description: "Mostrar todas as músicas de uma playlist"
            },
            notFound: {
                title: "## ❌ Playlist Não Encontrada",
                message: "A playlist **\"{name}\"** não existe.",
                note: "Por favor, verifique o nome da playlist e tente novamente."
            },
            accessDenied: {
                title: "## 🔒 Acesso Negado",
                message: "Você não tem permissão para visualizar esta playlist.",
                note: "Esta playlist é privada e apenas o dono pode visualizá-la."
            },
            empty: {
                title: "## 📋 Músicas em \"{name}\"",
                message: "Esta playlist está vazia. Adicione músicas usando `/addsong`!"
            },
            title: "## 🎵 Músicas em \"{name}\" (Página {currentPage}/{totalPages})",
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao mostrar as músicas da playlist.\nPor favor, tente novamente mais tarde."
            }
        },
        playcustomplaylist: {
            command: {
                name: "playcustomplaylist",
                description: "Tocar uma playlist personalizada"
            },
            notFound: {
                title: "## ❌ Playlist Não Encontrada",
                message: "A playlist **\"{name}\"** não existe.",
                note: "Por favor, verifique o nome da playlist e tente novamente."
            },
            accessDenied: {
                title: "## 🔒 Acesso Negado",
                message: "Você não tem permissão para tocar esta playlist.",
                note: "Esta playlist é privada e apenas o dono pode tocá-la."
            },
            empty: {
                title: "## ❌ Playlist Vazia",
                message: "A playlist **\"{name}\"** está vazia.",
                note: "Adicione algumas músicas à playlist primeiro!"
            },
            lavalinkManagerError: {
                title: "## ❌ Erro do Gerenciador Lavalink",
                message: "O gerenciador de nós Lavalink não foi inicializado.",
                note: "Por favor, entre em contato com o administrador do bot."
            },
            noNodes: {
                title: "## ❌ Sem Nós Lavalink",
                message: "Nenhum nó Lavalink está disponível no momento ({connected}/{total} conectados).",
                note: "O bot está tentando reconectar. Por favor, tente novamente em instantes."
            },
            resolveError: {
                title: "## ❌ Erro ao Resolver Música",
                message: "Falha ao resolver uma ou mais músicas da playlist.",
                note: "Por favor, verifique a playlist e tente novamente."
            },
            success: {
                title: "## 🎵 Tocando Playlist",
                message: "Tocando playlist **\"{name}\"**",
                songs: "**Músicas:** {count}"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao tocar a playlist.\nPor favor, tente novamente mais tarde."
            }
        }
    },
    utility: {
        twentyfourseven: {
            command: {
                name: "247",
                description: "Ativar/desativar modo 24/7 (manter o bot no canal de voz)"
            },
            accessDenied: {
                title: "## ❌ Acesso Negado",
                message: "Apenas o dono do servidor pode ativar/desativar o modo 24/7."
            },
            enabled: {
                title: "## ✅ Modo 24/7 Ativado",
                message: "O modo 24/7 foi **ativado** para este servidor.",
                note: "🔄 O bot permanecerá no canal de voz mesmo quando a fila estiver vazia."
            },
            disabled: {
                title: "## ❌ Modo 24/7 Desativado",
                message: "O modo 24/7 foi **desativado** para este servidor.",
                note: "⏹️ O bot sairá do canal de voz quando a fila terminar."
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao atualizar o modo 24/7.",
                note: "Por favor, tente novamente mais tarde."
            }
        },
        history: {
            command: {
                name: "history",
                description: "Mostrar faixas tocadas recentemente"
            },
            noHistory: {
                title: "## 📜 Nenhum Histórico Encontrado",
                message: "Nenhum histórico de reprodução encontrado para este servidor.",
                note: "Toque algumas músicas para construir seu histórico!"
            },
            title: "## 📜 Histórico de Reprodução",
            titlePaginated: "## 📜 Histórico de Reprodução (Página {currentPage}/{totalPages})",
            noMoreSongs: "- Não há mais músicas no histórico.",
            buttons: {
                previous: "⬅ Anterior",
                next: "Próximo ➡"
            },
            errors: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao recuperar o histórico.",
                note: "Por favor, tente novamente mais tarde."
            }
        }
    },
    events: {
        interactionCreate: {
            noGuild: "❌ **Este comando só pode ser usado em um servidor.**",
            commandNotFound: "❌ **Comando não encontrado!**",
            noPermission: "❌ **Você não tem permissão para usar este comando.**",
            errorOccurred: "❌ **Ocorreu um erro: {message}**",
            unexpectedError: "❌ **Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.**",
            errorTryAgain: "❌ Ocorreu um erro. Por favor, tente novamente."
        }
    },
    utils: {
        voiceChannelCheck: {
            noVoiceChannel: {
                title: "## ❌ Sem Canal de Voz",
                message: "Você precisa estar em um canal de voz para usar este comando.",
                note: "Por favor, entre em um canal de voz e tente novamente."
            },
            wrongChannel: {
                title: "## 🎵 Entre no Canal de Voz",
                message: "O bot está atualmente ativo em **{channelName}**.",
                note: "Por favor, entre em **{channelName}** para usar os comandos de música."
            }
        },
        playerValidation: {
            queueEmpty: {
                title: "## ❌ Fila Vazia",
                message: "A fila está vazia. Não há músicas disponíveis.",
                note: "Adicione algumas músicas à fila primeiro usando `/play`."
            },
            noSongPlaying: {
                title: "## ❌ Nenhuma Música Tocando",
                message: "Nenhuma música está tocando no momento.",
                note: "Use `/play` para começar a tocar música."
            },
            noMusicPlaying: {
                title: "## ❌ Sem Música Tocando",
                message: "Não há música tocando no momento e a fila está vazia.",
                note: "Use `/play` para começar a tocar música."
            }
        },
        responseHandler: {
            defaultError: {
                title: "## ❌ Erro",
                message: "Ocorreu um erro ao processar o comando.",
                note: "Por favor, tente novamente mais tarde."
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
            commandLoadFailed: "Falha ao carregar: {name} - Propriedade data ou run ausente",
            commandLoadError: "Erro ao carregar {name}: {message}",
            tokenVerification: "🔐 VERIFICAÇÃO DO TOKEN",
            tokenAuthFailed: "Autenticação Falhou ❌",
            tokenError: "Erro: Ative as Intents ou Redefina o Token",
            databaseOnline: "MongoDB Online ✅",
            databaseStatus: "🕸️  STATUS DO BANCO DE DADOS",
            databaseConnection: "🕸️  CONEXÃO DO BANCO DE DADOS",
            databaseFailed: "Conexão Falhou ❌",
            databaseError: "Erro: {message}",
            unhandledRejection: "Rejeição Não Tratada:",
            uncaughtException: "Exceção Não Capturada:",
            riffyThumbnailError: "[ Riffy ] Ignorando erro de thumbnail: {message}"
        },
        events: {
            rest: {
                commandsRegistered: "Registrados com sucesso {count} comandos de aplicação (/) globalmente ✅",
                commandsFailed: "Falha ao registrar comandos ❌",
                error: "Erro: {message}",
                details: "Detalhes: {details}"
            },
            interaction: {
                commandNotFound: "Comando não encontrado: {commandName}",
                errorExecuting: "Erro ao executar o comando {commandName}:",
                errorHelpButton: "Erro ao lidar com o botão de voltar da ajuda:",
                errorHelpSelect: "Erro ao lidar com a seleção de categoria da ajuda:",
                unexpectedError: "Erro inesperado:",
                failedToSendError: "Falha ao enviar mensagem de erro:"
            }
        },
        mongodb: {
            uriNotDefined: "A URI do MongoDB não está definida na configuração.",
            skippingConnection: "Pulando conexão com MongoDB pois a URI não foi fornecida.",
            connected: "Conectado ao MongoDB ✅",
            connectionFailed: "Não foi possível conectar ao MongoDB. Continuando sem funcionalidade de banco de dados."
        },
        lavalink: {
            nodesConfigured: "Nós configurados: {count}",
            riffyInitialized: "Inicializado com {count} nó(s)",
            nodeKeys: "Chaves dos nós:",
            failedToInitialize: "Falha ao inicializar Riffy: {message}",
            riffyReinitialized: "Riffy reinicializado",
            failedToReinitialize: "Falha ao reinicializar Riffy: {message}",
            nodeConnected: "Conectado: {name} ({host}:{port}) • {available}/{total} ativos",
            nodeDisconnected: "Desconectado: {name} ({host}:{port}) • {available}/{total} ativos",
            retryLimitReported: "Limite de tentativas reportado por {name}; loop de reconexão continua",
            nodeError: "Erro: {name} ({host}:{port}) • {message}",
            nodeStatus: "{available}/{total} ativos",
            waitingForConnection: "Aguardando conexão do nó Lavalink...",
            nodeAvailable: "Nó disponível ({count} conectados)",
            noNodesConnected: "Nenhum nó conectado ({connected}/{total}) — tentando reconectar...",
            nodeStatusReport: "Status dos Nós: {connected}/{total} conectados"
        },
        player: {
            lacksPermissions: "O bot não tem as permissões necessárias para enviar mensagens neste canal.",
            errorSendingMessage: "Erro ao enviar mensagem: {message}",
            trackException: "Exceção de Faixa para guild {guildId}: {message}",
            trackStuck: "Faixa Travada para guild {guildId}: {message}",
            trackNull: "Faixa nula ou sem informações para guild {guildId} - ignorando evento",
            playerInvalid: "Player inválido ou destruído para guild {guildId} - ignorando evento",
            channelNotFound: "Canal não encontrado para guild {guildId}",
            errorSavingHistory: "Erro ao salvar no histórico:",
            errorMusicCard: "Erro ao criar ou enviar card de música: {message}",
            autoplayDisabled: "Reprodução automática desativada para guild: {guildId}",
            errorQueueEnd: "Erro ao lidar com fim da fila:",
            errorCleanupPrevious: "Erro ao limpar mensagem da faixa anterior:",
            errorCleanupTrack: "Erro ao limpar mensagem da faixa:",
            lyricsFetchError: "❌ Erro ao buscar letras: {message}",
            unableToSendMessage: {
                title: "## ⚠️ Não Foi Possível Enviar Mensagem",
                message: "Não foi possível enviar a mensagem. Verifique as permissões do bot."
            },
            trackError: {
                title: "## ⚠️ Erro na Faixa",
                message: "Falha ao carregar a faixa.",
                skipping: "Pulando para a próxima música..."
            },
            unableToLoadCard: {
                title: "## ⚠️ Não Foi Possível Carregar o Card da Faixa",
                message: "Não foi possível carregar o card da faixa. Continuando a reprodução..."
            },
            queueEnd: {
                noMoreAutoplay: "⚠️ **Não há mais faixas para reprodução automática. Desconectando...**",
                queueEndedAutoplayDisabled: "🎶 **A fila terminou. A reprodução automática está desativada.**",
                queueEmpty: "👾 **Fila Vazia! Desconectando...**",
                twentyfoursevenEmpty: "🔄 **Modo 24/7: O bot permanecerá no canal de voz. A fila está vazia.**"
            },
            voiceChannelRequired: {
                title: "## 🔒 Canal de Voz Necessário",
                message: "Você precisa estar no mesmo canal de voz para usar os controles!"
            },
            controls: {
                skip: "⏭️ **Pulando para a próxima música...**",
                queueCleared: "🗑️ **A fila foi limpa!**",
                playbackStopped: "⏹️ **A reprodução foi parada e o player foi destruído!**",
                alreadyPaused: "⏸️ **A reprodução já está pausada!**",
                playbackPaused: "⏸️ **A reprodução foi pausada!**",
                alreadyResumed: "▶️ **A reprodução já está em andamento!**",
                playbackResumed: "▶️ **A reprodução foi retomada!**",
                volumeMax: "🔊 **O volume já está no máximo!**",
                volumeMin: "🔉 **O volume já está no mínimo!**",
                volumeChanged: "🔊 **Volume alterado para {volume}%!**",
                trackLoopActivated: "🔁 **Loop de faixa ativado!**",
                queueLoopActivated: "🔁 **Loop de fila ativado!**",
                loopDisabled: "❌ **Loop desativado!**"
            },
            lyrics: {
                noSongPlaying: "🚫 **Nenhuma música está tocando no momento.**",
                notFound: "❌ **Letra não encontrada!**",
                liveTitle: "## 🎵 Letra ao Vivo: {title}",
                syncing: "🔄 Sincronizando letra...",
                fullTitle: "## 🎵 Letra Completa: {title}",
                stopButton: "Parar Letra",
                fullButton: "Letra Completa",
                deleteButton: "Excluir"
            },
            trackInfo: {
                title: "**Título:**",
                author: "**Autor:**",
                length: "**Duração:**",
                requester: "**Solicitado por:**",
                source: "**Fonte:**",
                progress: "**Progresso:**",
                unknownArtist: "Artista Desconhecido",
                unknown: "Desconhecido"
            },
            controlLabels: {
                loop: "Loop",
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
