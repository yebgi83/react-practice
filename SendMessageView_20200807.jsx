import React, {Component, lazy, Suspense} from 'react'
import {connect} from "react-redux";
import Moment from "moment/moment";
import {
    BUTTON_TYPE,
    INPUT_PROPS,
    INPUT_TYPE,
    MESSAGE_CONTENT_TYPE,
    QUICK_COMMAND,
    TAG_TYPE,
    TALK_DELIVERY_STATUS,
    TTS_PROPS
} from '../../../Constants';
import OpenRequest from "../../api/chat/Open";
import SearchRequest from "../../api/chat/Search";
import ChatRequest from "../../api/chat/Message";
import {addChat, showURL, updateChat} from "../../../modules/chat";
import DefaultInputText from "../input/text/DefaultInputText";
import ScenarioInputText from "../input/text/ScenarioInputText";
import TTS from "../tts/TTS";
import StringFormat from "stringformat";
import {setBot} from "../../../modules/bot";
import Toast from "../../utils/Toast"

const UUID = require('uuid/v4');

const InputVoice = lazy(() => import('../input/voice/InputVoice'));

class SearchSendText {
    static of(tag, keyword) {
        return new SearchSendText(tag, keyword);
    }

    constructor(tag, keyword) {
        this.tag = tag;
        this.keyword = keyword;
    }

    warningOnInvalidSearch(searchOpt) {
        const {tag, keyword} = this;
        if (keyword && JSON.stringify(searchOpt) === tag.opt) {
            console.warn("'bots.yml' file's opt settings doesn't have a search parameter.")
        }
    }

    doApplyTo(messageView) {
        const {tag, keyword} = this;
        const searchOpt = JSON.parse(StringFormat(tag.opt, keyword));
        this.warningOnInvalidSearch(searchOpt);
        messageView.requestSearch(searchOpt, this.tag.purpose);
    };
}

class SendMessageView extends Component {
    constructor(props) {
        super(props);
        this.startTTS = this.startTTS.bind(this);
        this.addChat = this.addChat.bind(this);
        this.onBotError = this.onBotError.bind(this);
        this.onEndTTS = this.onEndTTS.bind(this);
        this.sendText = this.sendText.bind(this);
        window.sendText = this.sendText;
    }

    componentDidMount() {
        this.props.onRef && this.props.onRef(this);
        this.requestOpen(this.props.bot);
    }

    shouldComponentUpdate(nextProps) {
        return JSON.stringify(nextProps) !== JSON.stringify(this.props);
    }

    componentWillReceiveProps(nextProps) {
        const nextBot = nextProps.bot;
        if (JSON.stringify(this.props.bot) !== JSON.stringify(nextBot)) {
            this.requestOpen(nextBot);
        }
    }

    requestOpen(bot) {
        this.openRequest.request(bot.domains[0]);
    }

    createUserTalk = (message, userTalkId) => {
        return ({
            id: userTalkId + '|request',
            key: undefined,
            status: TALK_DELIVERY_STATUS.REQUEST,
            domain: undefined,
            bot: undefined,
            date: Moment.now().valueOf(),
            contents: [{type: "text", content: message}],
            tts: undefined,
            scenario: false,
            recommendations: [],
            expansion: undefined
        });
    };

    createBlankTalk = (userTalkId) => {
        return ({
            id: userTalkId,
            key: undefined,
            status: TALK_DELIVERY_STATUS.REQUEST,
            domain: undefined,
            bot: this.props.bot,
            date: Moment.now().valueOf(),
            contents: undefined,
            tts: undefined,
            scenario: false,
            recommendations: [],
            expansion: undefined
        });
    };

    requestSearch = (searchRequest) => {
        const {locale} = this.props;
        const userTalk = this.createBlankTalk(UUID());
        this.addChat(userTalk);
        this.searchRequest.request(userTalk.id, searchRequest, locale);
    };

    createQuickTalk = (keyword, purpose) => {
        const I18n = require('react-redux-i18n').I18n;
        const {locale} = this.props;
        return StringFormat(locale === "ko" ? "'{0}'" + I18n.t('quicktalk') + " {1}" : "{1} " + I18n.t('quicktalk') + " '{0}'", keyword, purpose);
    };

    sendText = (message, sendMessage, domains) => {
        const I18n = require('react-redux-i18n').I18n;
        sendMessage = sendMessage.trim();
        if (sendMessage.length === 0) {
            return;
        }
        if (sendMessage.startsWith(QUICK_COMMAND)) {
            const key = sendMessage.split(' ').shift().toUpperCase();
            const keyword = sendMessage.substr(key.length + 1, sendMessage.length);
            if (keyword) {
                const tag = this.props.bot.quick.find(menu => menu.question === key);
                if (tag) {
                    switch (tag.type) {
                        case TAG_TYPE.SEARCH:
                            SearchSendText
                                .of(tag, keyword)
                                .doApplyTo(this);
                            break;
                        case TAG_TYPE.CHANGE_BOT:
                            const bot = Object.values(this.props.bots).find(bot => bot[this.props.locale].name === keyword);
                            if (bot) {
                                this.props.setBot(bot[this.props.locale]);
                            } else {
                                this.toast.showWarning(StringFormat("'{0}'" + I18n.t('toast.warning.bot'), keyword));
                            }
                            break;
                        case TAG_TYPE.WIKI:
                            this.sendMessage(this.createQuickTalk(keyword, tag.purpose), keyword, 'wiki');
                            break;
                        case TAG_TYPE.POST_BACK:
                            this.sendMessage(this.createQuickTalk(keyword, tag.purpose), StringFormat(JSON.parse(tag.opt).message, keyword), domains);
                            break;
                    }
                } else {
                    this.sendMessage(undefined, sendMessage, domains);
                }
                this.input.clearText();
            } else {
                this.input.setText(StringFormat('{0} ', message));
            }
        } else {
            this.sendMessage(message, sendMessage, domains);
            this.input.clearText();
        }
    };

    sendMessage = (message, sendMessage, domains) => {
        const {bot, lastTalk} = this.props;
        let userTalkId = UUID();
        if (message) {
            const userTalk = this.createUserTalk(message, userTalkId);
            this.addChat(userTalk);
        }
        this.addChat(this.createBlankTalk(userTalkId));
        this.chatRequest.request(domains ? domains : lastTalk.scenario ? lastTalk.domain : bot.domains, userTalkId, sendMessage);
    };

    addChat(talk) {
        this.props.addChat(talk);
        const ttsText = talk.tts;
        if (ttsText && !this.props.isMute) {
            this.startTTS(ttsText, talk.id);
        }
    }

    startTTS(ttsText, messageID) {
        if (ttsText) {
            this.tts.startTTS(ttsText, messageID);
        } else {
            this.input.startListening();
        }
    }

    onBotMessage = (talkID, talk) => {
        if (talkID) {
            this.updateTalkStatus(talkID + '|request', TALK_DELIVERY_STATUS.SUCCESS);
        } else {
            talkID = UUID();
        }
        this.addReplyTalk(talkID, talk);
    };

    addReplyTalk = (talkID, talk) => {
        talk.messages.forEach(message => {
            this.addChat({
                id: talkID,
                key: talk.key,
                status: undefined,
                domain: talk.domain,
                bot: this.props.bot,
                date: talk.date,
                contents: message,
                tts: message.filter(msg => msg.type === MESSAGE_CONTENT_TYPE.TTS).map(msg => msg.content).toString(),
                scenario: talk.scenario,
                recommendations: talk.recommendations,
                expansion: talk.expansion
            });
        });
    };

    onEndTTS = () => {
        if (!this.props.isMute) {
            this.input.startListening();
        }
    };

    onBotError = (talkID) => {
        this.updateTalkStatus(talkID, TALK_DELIVERY_STATUS.FAIL);
    };

    updateTalkStatus(talkID, status) {
        this.props.updateChat({talkID: talkID, status: status});
    }

    clickButton = (button, domain) => {
        switch (button.type) {
            case BUTTON_TYPE.URL:
                if (button.value) {
                    // this.props.showURL({title: button.label, url: button.value});
                    if (IS_BOT) {
                        const I18n = require('react-redux-i18n').I18n;
                        this.toast.showWarning(I18n.t('toast.warning.unsupported'));
                    } else {
                        if (!window.open(button.value, "_blank")) {
                            window.location.href = button.value;
                        }
                    }
                }
                break;
            case BUTTON_TYPE.POST_BACK:
                if (button.value) {
                    this.sendMessage(undefined, button.value, domain);
                }
                break;
            case BUTTON_TYPE.FUNC:
                if (button.value) {
                    eval(button.value);
                }
                break;
            case BUTTON_TYPE.SEARCH:
                if (button.options) {
                    this.requestSearch(button.options, "검색");
                }
                break;
        }
    };

    isScenario() {
        const {lastTalk} = this.props;
        return lastTalk && lastTalk.scenario;
    }

    renderInput = () => {
        const {inputType, lastTalk} = this.props;
        switch (inputType.value) {
            case INPUT_TYPE.KEYBOARD:
                if (this.isScenario()) {
                    return (
                        <ScenarioInputText
                            lastTalk={lastTalk}
                            sendText={this.sendText}
                            onClickButton={this.clickButton}
                            onRef={ref => (this.input = ref)}
                        />
                    );
                } else {
                    return (
                        <DefaultInputText
                            sendText={this.sendText}
                            onClickButton={this.clickButton}
                            onRef={ref => (this.input = ref)}
                        />
                    );
                }
            case INPUT_TYPE.VOICE:
                return <Suspense fallback={'...'}>
                    <section><InputVoice sendText={this.sendText} onRef={ref => (this.input = ref)}/></section>
                </Suspense>;
        }
    };

    render() {
        return (
            <div className="profile-input-box">
                {/*<React.Fragment>*/}
                <Toast onRef={ref => (this.toast = ref)}/>
                <OpenRequest
                    onSuccess={this.onBotMessage}
                    onError={this.onBotError}
                    onRef={ref => (this.openRequest = ref)}
                />
                <ChatRequest
                    onSuccess={this.onBotMessage}
                    onError={this.onBotError}
                    onRef={ref => (this.chatRequest = ref)}
                />
                <SearchRequest
                    onSuccess={this.onBotMessage}
                    onError={this.onBotError}
                    onRef={ref => (this.searchRequest = ref)}
                />
                <TTS
                    onEndTTS={this.onEndTTS}
                    onRef={ref => (this.tts = ref)}
                />
                {this.renderInput()}
                {/*</React.Fragment>*/}
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    const datasource = state.chat.datasource;
    return {
        bot: state.bot.bot,
        bots: state.bot.bots,
        datasource: datasource,
        lastTalk: datasource.size > 0 && Array.from(datasource)[datasource.size - 1],
        ttsType: TTS_PROPS.get(state.settings.ttsType),
        inputType: INPUT_PROPS.get(state.settings.inputType),
        isMute: state.settings.isMute,
        locale: state.i18n.locale
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        addChat: (talk) => dispatch(addChat(talk)),
        updateChat: (talk) => dispatch(updateChat(talk)),
        showURL: (url) => dispatch(showURL(url)),
        setBot: (bot) => dispatch(setBot(bot))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(SendMessageView);
