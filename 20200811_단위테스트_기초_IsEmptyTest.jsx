import isEmpty from "../src/IsEmpty";
import {test} from "@jest/globals";

// 해당 단위 테스트는 아래의 링크를 참고했음을 알려드립니다.
// https://www.daleseo.com/jest-basic/

// 아래의 단위 테스트를 실행하려면
// npm 명령어에 있는 test를 실행하면 됩니다.

test("숫자로 이루어진 값인 경우은 false를  리턴해야 한다.", () => {
    // actual는 실제 값을 의미합니다.
    const actual = isEmpty(1);

    // expected는 기대 값, 즉 어떤 값이 나와야 정답인지를 의미합니다.
    const expected = false;

    // 실제로 단위 테스트를 수행하는 건 아래의 줄입니다.
    // 아래에서는 expected와 toBe라는 함수를 제공합니다.
    // expected 함수를 사용하여 actualValue 값을 설정해주고, toBe 값을 이용하여 정답을 집어넣어줍니다.
    expect(actual)
        .toBe(expected);
})

test("비어있는 문자열은 true를 리턴해야 한다.", () => {
    const actual = isEmpty("abc");
    const expected = true;

    expect(actual)
        .toBe(expected);
})

test("null값인 경우은 true를 리턴해야 한다.", () => {
    const actual = isEmpty(null);
    const expected = true;

    expect(actual)
        .toBe(expected);
})

test("비어있는 배열인 경우은 true를 리턴해야 한다.", () => {
    const actual = isEmpty([]);
    const expected = true;

    expect(actual)
        .toBe(expected);
})
