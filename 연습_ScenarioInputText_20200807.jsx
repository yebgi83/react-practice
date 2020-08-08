import React, {Component} from 'react';
import {BUTTON_TYPE, MESSAGE_CONTENT_TYPE, QUICK_COMMAND} from "../../../../Constants";
import StringFormat from "stringformat";
import {I18n, Translate} from 'react-redux-i18n';
import InputTextProvider from "./InputTextProvider"
import {getTitle} from "../../view/RenderUtils";

class Renderer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            context: null
        };

        this.input = React.createRef();
    }

    componentDidMount() {
        this.props.onRef && this.props.onRef(this);
    }

    componentDidUpdate() {
        this.displayScrollButton();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (JSON.stringify(nextProps) !== JSON.stringify(this.props) || JSON.stringify(nextState) !== JSON.stringify(this.state));
    }

    onSelect(selectedItem) {
        const {actions} = this.state.context;

        if (selectedItem) {
            if (selectedItem.domain === QUICK_COMMAND) {
                actions.sendText(selectedItem.question, selectedItem.question, selectedItem.domain);
            } else {
                actions.sendText(selectedItem.question, StringFormat('#PK={0}', selectedItem.key), selectedItem.domain)
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

    onMessageChange = () => {
        this.input.current.focus();
    }

    setText(text) {
        const {actions} = this.state.context;
        actions.setText(text);
    }

    clearText() {
        const {actions} = this.state.context;
        actions.clearText();
    }

    displayScrollButton() {
        if (this.isScrollable()) {
            const clientHeight = this.buttonList.clientHeight;
            const scrollHeight = this.buttonList.scrollHeight;

            if (clientHeight < scrollHeight) {
                this.buttonArea.classList.add("scroll");
                this.buttonList.addEventListener(
                    'scroll',
                    (event) => {
                        let scrollTop = this.buttonList.scrollTop;

                        if (scrollTop > 10) {
                            if (this.buttonArea.classList.contains("scroll")) {
                                this.buttonArea.classList.remove("scroll");
                            }
                        } else {
                            this.buttonArea.classList.add("scroll");
                        }
                    }
                );
            }
        }
    }

    isScrollable() {
        return this.buttonArea && this.buttonList;
    }

    getLastTalkButtons() {
        const buttons = this.props.lastTalk
            .contents
            .filter(content => content.type === MESSAGE_CONTENT_TYPE.BUTTONS)
            .map(content => content.buttons);

        return buttons
            .reduce((acc, val) => acc.concat(val), []);
    }

    renderButton = (button, domain) => {
        return (
            <li
                key={button.label}
                onClick={() => {
                    this.props.onClickButton(button, domain)
                }}
            >
                <a
                    aria-label={button.label}
                    role='button'
                >
                    {button.label}
                </a>
            </li>
        )
    };

    renderBackButton = (domain) => {
        return (
            <button
                className="left"
                title={I18n.t('input.button.back')}
                onClick={() => {
                    this.props.onClickButton({
                        type: BUTTON_TYPE.POST_BACK,
                        label: I18n.t('input.button.back'),
                        value: "back"
                    }, domain)
                }}
            >
                <i className="fas fa-arrow-left"/>
            </button>
        )
    };

    renderInputMenu = (domain, isInputOnly) => {
        return (
            <div
                className="title"
                role="dialog"
            >
                {isInputOnly ? false : this.renderBackButton(domain)}
                {isInputOnly ? <Translate value='input.text'/> : <Translate value='input.button.explain'/>}
                <button
                    className="right"
                    title={I18n.t('input.button.close')}
                    onClick={() => {
                        this.props.onClickButton(
                            {
                                type: BUTTON_TYPE.POST_BACK,
                                label: I18n.t('input.button.close'),
                                value: "/q"
                            }, domain
                        )
                    }}
                >
                    <i className="fas fa-times"/>
                </button>
            </div>
        )
    };

    render() {
        const {lastTalk} = this.props;
        const lastTalkButtons = this.getLastTalkButtons();

        if (lastTalkButtons.length > 0) {
            return (
                <div
                    className="story-pannel active"
                    ref={div => this.buttonArea = div}
                >
                    {this.renderInputMenu(lastTalk.domain, false)}
                    <ul
                        ref={(div) => {
                            this.buttonList = div
                        }}
                    >
                        {
                            lastTalkButtons
                                .map(button => this.renderButton(button, lastTalk.domain))
                        }
                    </ul>
                </div>
            );
        } else {
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
                                <div
                                    className="story-pannel active"
                                    ref={div => this.buttonArea = div}
                                >
                                    {this.renderInputMenu(lastTalk.domain, true)}
                                    <input
                                        autoFocus={true}
                                        className="text-input"
                                        placeholder={getTitle(lastTalk.contents) || I18n.t('input.placeholder')}
                                        title={getTitle(lastTalk.contents)}
                                        value={state.inputValue}
                                        onChange={this.onChange.bind(this)}
                                        onKeyUp={this.onKeyUp.bind(this)}
                                    />
                                </div>
                            )
                        }
                    }
                </InputTextProvider>
            )
        }
    }
}

export default Renderer;
