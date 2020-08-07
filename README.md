# DatePicker 관련<br>

### 기존 소스는 컴포넌트 클래스에 여러가지 책임이 들어있어서, 책임을 분리하는 작업을 진행함<br>
1. 기존에는 DatePicker 클래스 내부에 모든 소스 내용이 다 들어간 구조였음 <br>
그리고 내부에 특정 변수에 엮여있거나, 함수 간에 서로 엮여있는 형태로 보았을 때 아래와 같이 두 부분으로 분리가 가능
* constructor(props), componentDidMount(), render() 이외에 나머지 함수들은 공통으로 특정 변수를 공유하고, 서로 간의 함수가 실행됨<br>
* constructor(props), componentDidMount(), render() 는 React 컴포넌트에서 기본적으로 가져야 하는 함수<br>

2. 그래서 위의 두 부분을 아래와 같이 분리하기로 함
* constructor(props), componentDidMount(), render() 이외에 나머지 함수들은 공통으로 특정 변수를 공유하고, 서로 간의 함수가 실행되는 부분은 "UI 구성을 초기화" 하는 공통의 목표를 가지고
있는 것으로 보임 => UIInitializer 라는 요소로 분리
* 나머지는 React 컴포넌트에서 Render를 하기 위함이므로, Renderer 라는 요소로 분리
* 그리고 React 컴포넌트를 export 하도록 처리 (UIInitialize 하는 부분은 소스 내부에서만 사용할 수 있도록 숨김)

3. 20190731 연습에서는 UIInitialize 하는 부분을 JavaScript의 Object 형식으로 분리<br>
4. 20190801 연습에서는 내부 class로 만들어서 가져오는 식으로 시도해봄.<br>

# InputText 관련

아래의 포스트를 참조하여 공통으로 갖는 부분을 분리함
https://link.medium.com/dEhMG5N1K8

목적에 따라서 공통으로 갖는 부분을 활용하여 여러가지 렌더링되는 컴포넌트를 만드는 방식으로 진행

