import React, {Component} from 'react';
import {QUICK_COMMAND, TAG_TYPE} from "../../../../Constants";
import StringFormat from "stringformat";
import {I18n} from 'react-redux-i18n';
import Downshift from "downshift";
import {When} from "react-if";
import InputTextProvider from "./InputTextProvider"
import RecommendsRequest from "../../../api/chat/Recommends";

class Renderer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            recommends: [],
            context: null
        };

        this.input = React.createRef();
    }

    componentDidMount() {
        this.props.onRef && this.props.onRef(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (JSON.stringify(nextProps) !== JSON.stringify(this.props) || JSON.stringify(nextState) !== JSON.stringify(this.state));
    }

    buildAriaMessageForRecommend(recommend) {
        return StringFormat('"{0}" 버튼', recommend.purpose || recommend.question);
    }

    onRecommendRequest = (keyword) => {
        return !keyword.startsWith(QUICK_COMMAND);
    };

    onRecommends = (response) => {
        this.setState({recommends: response});
    };

    onRecommendsError = () => {
        this.clearRecommendations();
    };

    onSelect(selectedItem) {
        const {actions} = this.state.context;

        if (selectedItem) {
            try {
                if (selectedItem.domain === QUICK_COMMAND) {
                    actions.sendText(selectedItem.question, selectedItem.question, selectedItem.domain);
                } else {
                    actions.sendText(selectedItem.question, StringFormat('#PK={0}', selectedItem.key), selectedItem.domain)
                }
            } finally {
                this.clearRecommendations();
            }
        }
    };

    onChange(event) {
        const {actions} = this.state.context;
        actions.setText(event.currentTarget.value);
    }

    onKeyUp(event) {
        const {state, actions} = this.state.context;

        if (event.key === 'Enter') {
            try {
                actions.sendText(state.inputValue, state.inputValue);
            } finally {
                event.currentTarget.value = "";
                event.preventDefault();
            }
        }
    }

    onMessageChange = (text) => {
        try {
            const {state} = this.state.context;

            this.setState({
                recommends: []
            });

            if (this.isQuickCommand(text)) {
                if (state.bot.quick) {
                    this.onQuickMessage(text);
                } else {
                    this.toast.showWarning(I18n.t('toast.warning.noquick'));
                    this.clearText();
                }
            } else {
                this.recommendsRequest.request(state.bot.domains, text)
            }
        } finally {
            this.input.current.focus();
        }
    }

    onQuickMessage(text) {
        const {state} = this.state.context;

        if (text.startsWith(QUICK_COMMAND + I18n.t('input.recommends.bot'))) {
            const keyword = this.getKeyword(text);
            this.setState({
                recommends: this.getBotChangeCommands(keyword)
            })
        } else {
            this.setState({
                recommends:
                    state
                        .bot
                        .quick
                        .filter(menu => menu.question.startsWith(text))
            })
        }
    }

    isQuickCommand(text) {
        return text && text.startsWith(QUICK_COMMAND);
    }

    setText(text) {
        const {actions} = this.state.context;
        actions.setText(text);
    }

    clearText() {
        const {actions} = this.state.context;
        actions.clearText();
    }

    clearRecommendations() {
        this.setState({recommends: []});
    }

    getActualBot(bot) {
        let {locale} = this.props;
        return bot[locale];
    }

    isValidBotByKeyword(bot, keyword) {
        let actualBot = this.getActualBot(bot);

        if (actualBot) {
            return actualBot.name !== bot.name && actualBot.name.startsWith(keyword);
        } else {
            return false;
        }
    }

    getKeyword(text) {
        const key = text
            .split(' ')
            .shift();

        return text.substr(key.length + 1, text.length);
    }

    getBotChangeCommands(keyword) {
        const {state} = this.state.context;
        return Object
            .values(state.bots)
            .filter(bot => this.isValidBotByKeyword(bot, keyword))
            .map(bot => {
                let actualBot = this.getActualBot(bot);

                return {
                    domain: QUICK_COMMAND,
                    hilitedQuestion: this.getBotChangeQuestion(actualBot, true),
                    question: this.getBotChangeQuestion(actualBot, false),
                    purpose: I18n.t('input.recommends.purpose'),
                    name: bot,
                    type: TAG_TYPE.CHANGE_BOT
                };
            })
    }

    getBotChangeQuestion(bot, hilited) {
        if (hilited) {
            return StringFormat('<hilite>{0}</hilite> {1}', QUICK_COMMAND + I18n.t('input.recommends.bot'), bot.name)
        } else {
            return StringFormat('{0} {1}', QUICK_COMMAND + I18n.t('input.recommends.bot'), bot.name);
        }
    }

    render() {
        const {recommends} = this.state;

        return (
            <InputTextProvider
                onMessageChange={this.onMessageChange.bind(this)}
                sendText={this.props.sendText.bind(this)}
            >
                {
                    ({state, actions}) => {
                        this.setState({
                            context: {state, actions}
                        });
                        return (
                            <React.Fragment>
                                <RecommendsRequest
                                    onRequest={this.onRecommendRequest.bind(this)}
                                    onSuccess={this.onRecommends.bind(this)}
                                    onError={this.onRecommendsError.bind(this)}
                                    onRef={ref => (this.recommendsRequest = ref)}
                                />
                                <Downshift
                                    onSelect={this.onSelect.bind(this)}
                                    getA11yStatusMessage={() => ''}
                                    itemToString={recommend => (recommend ? recommend.question : '')}
                                >
                                    {({
                                          getInputProps,
                                          getItemProps,
                                          getMenuProps,
                                          isOpen,
                                          highlightedIndex,
                                          selectedItem,
                                          getRootProps,
                                      }) => (
                                        <div className="downshift-wrap">
                                            <div
                                                {...getRootProps({}, {suppressRefError: true})}
                                                className="text-input-wrap"
                                            >
                                                <When condition={!!state.isVoiceMode}>
                                            <span className="btn-change-input">
                                                <i className="fas fa-keyboard fa-lg"/>
                                            </span>
                                                </When>
                                                <input
                                                    autoFocus={true}
                                                    style={{imeMode: 'auto'}}
                                                    {...getInputProps({
                                                        value: state.inputValue,
                                                        onChange: this.onChange.bind(this),
                                                        onKeyUp: this.onKeyUp.bind(this),
                                                    })}
                                                    aria-label={I18n.t('aria-label.input')}
                                                    placeholder={I18n.t('input.placeholder')}
                                                    className="text-input"
                                                    ref={this.input}
                                                />
                                                <When condition={!!state.bot.quick && state.bot.quick.length > 0}>
                                                    <button
                                                        className="text-input-button"
                                                        style={{marginRight: '10px', cursor: 'pointer'}}
                                                        title={I18n.t('aria-label.quick.title')}
                                                        onClick={() => actions.setText("/")}
                                                    >
                                                        <i className="fas fa-hashtag fa-lg"
                                                           aria-label={I18n.t('aria-label.quick.button')}
                                                        />
                                                    </button>
                                                </When>
                                            </div>
                                            <div>
                                                <ul className="auto-search-list" {...getMenuProps()}>
                                                    {
                                                        recommends
                                                            .map((item, index) => (
                                                                <li
                                                                    className={highlightedIndex === index ? 'question on' : 'question'}
                                                                    dangerouslySetInnerHTML={{__html: item.hilitedQuestion}}
                                                                    aria-label={this.buildAriaMessageForRecommend(item)}
                                                                    {...getItemProps({
                                                                        key: item.key,
                                                                        index,
                                                                        item
                                                                    })}
                                                                />
                                                            ))
                                                    }
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </Downshift>
                            </React.Fragment>
                        )
                    }
                }
            </InputTextProvider>
        )
    }
}

export default Renderer;
