import React, {Component, Children, Suspense} from 'react';
import {QUICK_COMMAND, TAG_TYPE} from "../../../../Constants";
import StringFormat from "stringformat";
import {I18n} from 'react-redux-i18n';
import VirtualKeyboard from "./VirtualKeyboard";
import {setBot} from "../../../../modules/bot";
import {withMessageStatus} from "../../../provider/MessageStatusProvider";
import {connect} from "react-redux";

const MessageStatusProvider = (WrappedComponent) => withMessageStatus(
    connect(
        (state) => {
            return {
                bot: state.bot.bot,
                bots: state.bot.bots,
                isVoiceMode: state.settings.isVoiceMode,
                locale: state.i18n.locale,
                isVirtualMode: state.settings.isVirtualMode,
                backgroundStyle: state.settings.backgroundStyle
            };
        },
        (dispatch) => {
            return {
                setBot: (bot) => dispatch(setBot(bot))
            }
        }
    )
    (WrappedComponent)
);

class Renderer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            inputValue: '',
            context: null
        };
    }

    setText(text) {
        this.setState({
            inputValue: text
        });

        this.props.onMessageChange(text ? text.toUpperCase() : '');

        if (this.keyboard) {
            this.keyboard.keyboard.setInput(message);
        }
    }

    clearText() {
        this.setState({
            inputValue: ''
        });
    }

    getContext() {
        const {state} = this;
        return {
            state: {
                ...state,
                bot: this.props.bot,
                bots: this.props.bots,
                isVoiceMode: this.props.isVoiceMode,
                locale: this.props.locale,
                isVirtualMode: this.props.isVirtualMode,
                backgroundStyle: this.props.backgroundStyle
            },
            actions: {
                clearText : this.clearText.bind(this),
                setText: this.setText.bind(this),
                sendText: this.props.sendText.bind(this)
            }
        };
    }

    render() {
        console.log(this.props.children);
        return (
            <React.Fragment>
                <div
                    className={
                        this.props.backgroundStyle ?
                            'text-input-background show' :
                            'text-input-background'
                    }
                />
                <div className='text-input-div'>
                    {
                        this.props.children(this.getContext())
                    }
                    {
                        this.props.isVirtualMode ?
                            <Suspense fallback={'...'}>
                                <VirtualKeyboard
                                    sendText={this.props.sendText.bind(this)}
                                    setText={this.setText.bind(this)}
                                    onRef={ref => (this.keyboard = ref)}
                                />
                            </Suspense>
                            : false
                    }
                </div>
            </React.Fragment>
        );
    }
}

export default MessageStatusProvider(Renderer);
