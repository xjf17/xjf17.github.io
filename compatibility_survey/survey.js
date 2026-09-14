(function () {
    "use strict";

    const apiBaseUrl = (window.COMPATIBILITY_SURVEY_API_BASE_URL || "").replace(/\/$/, "");

    const state = {
        sessionUuid: "",
        autoParticipantUuid: "",
        infoTextVersion: "",
        questions: [],
        currentIndex: 0,
        initialOrder: [],
        dragSource: null,
    };

    const startSection = document.getElementById("start-section");
    const surveySection = document.getElementById("survey-section");
    const finishSection = document.getElementById("finish-section");

    const startForm = document.getElementById("start-form");
    const startError = document.getElementById("start-error");
    const surveyError = document.getElementById("survey-error");

    const questionTitle = document.getElementById("question-title");
    const questionProgress = document.getElementById("question-progress");
    const autoId = document.getElementById("auto-id");
    const stageHint = document.getElementById("stage-hint");
    const imageRow = document.getElementById("image-row");
    const infoPanel = document.getElementById("info-panel");
    const infoText = document.getElementById("info-text");

    const actionsInitial = document.getElementById("actions-initial");
    const submitInitialBtn = document.getElementById("submit-initial-btn");
    const keepOrderBtn = document.getElementById("keep-order-btn");
    const submitFinalBtn = document.getElementById("submit-final-btn");

    const imageModal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");
    const modalClose = document.getElementById("modal-close");

    let afterInfoPhase = false;

    function setError(element, message) {
        if (!message) {
            element.textContent = "";
            element.classList.add("hidden");
            return;
        }
        element.textContent = message;
        element.classList.remove("hidden");
    }

    function currentQuestion() {
        return state.questions[state.currentIndex];
    }

    function resolveAssetUrl(url) {
        if (!url || !url.startsWith("/")) {
            return url;
        }
        return `${apiBaseUrl}${url}`;
    }

    function getCurrentOrder() {
        return Array.from(imageRow.querySelectorAll(".image-card")).map((card) => card.dataset.imageId);
    }

    function updateRanks() {
        const cards = imageRow.querySelectorAll(".image-card");
        cards.forEach((card, idx) => {
            const rankNode = card.querySelector(".rank-badge");
            rankNode.textContent = String(idx + 1);
        });
    }

    function renderQuestion() {
        const question = currentQuestion();
        if (!question) {
            surveySection.classList.add("hidden");
            finishSection.classList.remove("hidden");
            return;
        }

        setError(surveyError, "");
        afterInfoPhase = false;
        state.initialOrder = [];

        questionTitle.textContent = `题目：${question.folder_name}`;
        questionProgress.textContent = `第 ${state.currentIndex + 1} / ${state.questions.length} 题`;
        stageHint.textContent = "图中这栋建筑是历史建筑或文化遗产，现有几个周边环境的选项，请评估周围环境与该建筑看起来是否协调，周围的建筑是否与当前建筑兼容。请按兼容性拖拽排序，数字 1 表示最兼容，数字越大表示越不兼容。";

        actionsInitial.classList.remove("hidden");
        infoPanel.classList.add("hidden");

        imageRow.innerHTML = "";
        question.images.forEach((img) => {
            const card = document.createElement("article");
            card.className = "image-card";
            card.draggable = true;
            card.dataset.imageId = img.image_id;

            const rankBadge = document.createElement("div");
            rankBadge.className = "rank-badge";
            rankBadge.textContent = "";

            const imageWrapper = document.createElement("div");
            imageWrapper.className = "image-wrapper";

            const image = document.createElement("img");
            image.className = "image-thumb";
            image.src = resolveAssetUrl(img.url);
            image.alt = img.filename;

            const zoomButton = document.createElement("button");
            zoomButton.type = "button";
            zoomButton.className = "zoom-btn";
            zoomButton.title = "放大查看";
            zoomButton.textContent = "放大";
            zoomButton.addEventListener("mousedown", (event) => {
                event.stopPropagation();
            });
            zoomButton.addEventListener("click", (event) => {
                event.stopPropagation();
                openModal(resolveAssetUrl(img.url), img.filename);
            });

            const label = document.createElement("div");
            label.className = "image-label";
            label.textContent = img.filename;

            card.appendChild(rankBadge);
            imageWrapper.appendChild(image);
            imageWrapper.appendChild(zoomButton);
            card.appendChild(imageWrapper);
            card.appendChild(label);
            bindDragEvents(card);
            imageRow.appendChild(card);
        });

        updateRanks();
    }

    function bindDragEvents(card) {
        card.addEventListener("dragstart", (event) => {
            state.dragSource = card;
            event.dataTransfer.effectAllowed = "move";
            card.classList.add("dragging");
        });

        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
            state.dragSource = null;
            updateRanks();
        });

        card.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        });

        card.addEventListener("drop", (event) => {
            event.preventDefault();
            if (!state.dragSource || state.dragSource === card) {
                return;
            }
            const cards = Array.from(imageRow.children);
            const sourceIndex = cards.indexOf(state.dragSource);
            const targetIndex = cards.indexOf(card);
            if (sourceIndex < 0 || targetIndex < 0) {
                return;
            }

            if (sourceIndex < targetIndex) {
                imageRow.insertBefore(state.dragSource, card.nextSibling);
            } else {
                imageRow.insertBefore(state.dragSource, card);
            }
            updateRanks();
        });
    }

    function openModal(imageSrc, altText) {
        modalImage.src = imageSrc;
        modalImage.alt = altText || "放大预览";
        imageModal.classList.remove("hidden");
    }

    function closeModal() {
        imageModal.classList.add("hidden");
        modalImage.src = "";
    }

    async function postJson(url, payload) {
        const response = await fetch(`${apiBaseUrl}${url}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `请求失败: ${response.status}`);
        }
        return response.json();
    }

    async function onStartSurvey(event) {
        event.preventDefault();
        setError(startError, "");

        const formData = new FormData(startForm);
        const payload = {
            participant_name: formData.get("participant_name"),
            age: formData.get("age"),
            education_level: formData.get("education_level"),
            gender: formData.get("gender"),
            residence_city: formData.get("residence_city"),
            heritage_interest: formData.get("heritage_interest"),
            relevant_experience_duration: formData.get("relevant_experience_duration"),
            heritage_related_experience: formData.get("heritage_related_experience"),
            nationality: formData.get("nationality"),
        };

        try {
            const data = await postJson("/api/start", payload);
            state.sessionUuid = data.session_uuid;
            state.autoParticipantUuid = data.auto_participant_uuid;
            state.infoTextVersion = data.info_text_version;
            state.questions = data.questions || [];
            state.currentIndex = 0;

            autoId.textContent = state.autoParticipantUuid;
            infoText.textContent = data.info_text || infoText.textContent;

            startSection.classList.add("hidden");
            surveySection.classList.remove("hidden");
            renderQuestion();
        } catch (error) {
            setError(startError, `启动失败：${error.message}`);
        }
    }

    async function onSubmitInitial() {
        setError(surveyError, "");
        const question = currentQuestion();
        const order = getCurrentOrder();
        if (!question || !order.length) {
            setError(surveyError, "当前题目数据异常，请刷新页面。");
            return;
        }

        submitInitialBtn.disabled = true;
        try {
            await postJson("/api/submit-initial", {
                session_uuid: state.sessionUuid,
                question_index: state.currentIndex,
                question_folder: question.folder_name,
                image_order_initial: order,
            });
            state.initialOrder = order.slice();
            afterInfoPhase = true;
            actionsInitial.classList.add("hidden");
            infoPanel.classList.remove("hidden");
            stageHint.textContent = "已展示补充信息。你可以保持不变，或继续拖拽后确认。";
        } catch (error) {
            setError(surveyError, `提交失败：${error.message}`);
        } finally {
            submitInitialBtn.disabled = false;
        }
    }

    async function submitFinalAndNext(forceNoChange) {
        setError(surveyError, "");
        if (!afterInfoPhase) {
            setError(surveyError, "请先提交初次排序。");
            return;
        }

        const question = currentQuestion();
        const finalOrder = getCurrentOrder();
        const changed =
            !forceNoChange &&
            JSON.stringify(state.initialOrder) !== JSON.stringify(finalOrder);

        keepOrderBtn.disabled = true;
        submitFinalBtn.disabled = true;
        try {
            await postJson("/api/submit-final", {
                session_uuid: state.sessionUuid,
                question_index: state.currentIndex,
                question_folder: question.folder_name,
                image_order_initial: state.initialOrder,
                image_order_final: forceNoChange ? state.initialOrder : finalOrder,
                changed_after_info: changed,
            });
            state.currentIndex += 1;
            renderQuestion();
        } catch (error) {
            setError(surveyError, `确认失败：${error.message}`);
        } finally {
            keepOrderBtn.disabled = false;
            submitFinalBtn.disabled = false;
        }
    }

    startForm.addEventListener("submit", onStartSurvey);
    submitInitialBtn.addEventListener("click", onSubmitInitial);
    keepOrderBtn.addEventListener("click", () => submitFinalAndNext(true));
    submitFinalBtn.addEventListener("click", () => submitFinalAndNext(false));

    modalClose.addEventListener("click", closeModal);
    imageModal.addEventListener("click", (event) => {
        if (event.target === imageModal) {
            closeModal();
        }
    });
})();
