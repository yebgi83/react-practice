import React, {Component} from "react"
import {Else, If, Then} from "react-if";
import StringFormat from "stringformat";
import {ContextMenu} from "react-contextmenu";
import MenuItem from "./MenuItem"
import {CopyToClipboard} from 'react-copy-to-clipboard';

import Toast from '../../../../utils/Toast'
import {CATEGORY_TYPE} from "../../../../Categories";
import {download, isAdmin, isEmpty, isLocalHost, open} from "../../../../utils/Utility";
import '../../../style/context-menu.css';

class File extends Component {
    shouldComponentUpdate(nextProps, nextState) {
        return (JSON.stringify(nextProps) !== JSON.stringify(this.props));
    }

    render() {
        return ((props) => {
            if (isEmpty(props.file)) {
                return false;
            }

            switch (props.file.meta.type) {
                case CATEGORY_TYPE.DOCUMENT:
                case CATEGORY_TYPE.AUDIO:
                case CATEGORY_TYPE.CODE:
                case CATEGORY_TYPE.IMAGE:
                case CATEGORY_TYPE.VIDEO:
                case CATEGORY_TYPE.ZIP:
                case CATEGORY_TYPE.ETC:
                    const downloadUrl = props.file.url ? props.file.url : !props.agentKey ? StringFormat('/ajax/request/v1/{0}/download/{1}/ORIGINAL/{2}', props.file.indexerKey, props.file.key, encodeURIComponent(props.file.title)) : StringFormat('/ajax/request/v1/{0}/{1}/download/{2}/ORIGINAL/{3}', props.agentKey, props.file.indexerKey, props.file.key, encodeURIComponent(props.file.title));
                    return (
                        <React.Fragment>
                            <Toast onRef={ref => (this.toast = ref)}/>
                            <ContextMenu id={props.file.key}>
                                <MenuItem onClick={() => download(downloadUrl)}>
                                    <If condition={isLocalHost()}>
                                        <Then>
                                            <i className="fas fa-copy"/>복사본 생성
                                        </Then>
                                        <Else>
                                            <i className="fas fa-file-download"/>다운로드
                                        </Else>
                                    </If>
                                </MenuItem>
                                <MenuItem
                                    isVisible={isLocalHost()}
                                    onClick={() => open(props.file.indexerKey, props.file.parentKey)}
                                >
                                    <i className="fas fa-folder-open"/>폴더열기
                                </MenuItem>
                                <MenuItem
                                    isVisible={isLocalHost()}
                                    onClick={() => open(props.file.indexerKey, props.file.key)}
                                >
                                    <i className="fas fa-external-link-alt"/>파일열기
                                </MenuItem>
                                <MenuItem
                                    onClick={() => props.setNavigationKey(props.file.indexerKey, props.file.parentKey)}
                                >
                                    <i className="fas fa-folder"/>위치로 이동
                                </MenuItem>
                                <MenuItem>
                                    <CopyToClipboard
                                        text={props.file.path.string}
                                        onCopy={() => {
                                            if (!isEmpty(this.toast)) {
                                                this.toast.showInfo("클립보드", "경로가 복사되었습니다.")
                                            }
                                        }}
                                    >
                                        <span>
                                            <i className="fas fa-paste"/>경로 복사
                                        </span>
                                    </CopyToClipboard>
                                </MenuItem>
                                <MenuItem
                                    isVisible={isAdmin()}
                                    onClick={() => props.showDeleteFile({
                                        agentKey: props.agentKey,
                                        file: props.file
                                    })}
                                >
                                    <i className="fas fa-trash"/>파일삭제
                                </MenuItem>
                            </ContextMenu>
                        </React.Fragment>
                    );
            }
        })(this.props);
    }
}

export default File;
