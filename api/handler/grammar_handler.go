package handler

import (
	"net/http"

	"github.com/Tranduy1dol/kotoba-press-core/api/apperror"
	"github.com/Tranduy1dol/kotoba-press-core/api/dto"
	"github.com/Tranduy1dol/kotoba-press-core/internal/usecase"
	"github.com/gin-gonic/gin"
)

type GrammarHandler struct {
	lookupSvc *usecase.LookupService
}

func NewGrammarHandler(lookupSvc *usecase.LookupService) *GrammarHandler {
	return &GrammarHandler{lookupSvc: lookupSvc}
}

// GetGrammar godoc
// @Summary     Get grammar by ID
// @Tags        grammar
// @Produce     json
// @Param       id path string true "Grammar ID"
// @Success     200 {object} dto.GrammarResponse
// @Failure     400 {object} apperror.AppError
// @Failure     404 {object} apperror.AppError
// @Failure     500 {object} apperror.AppError
// @Security    BearerAuth
// @Router      /grammar/{id} [get]
func (h *GrammarHandler) GetGrammar(ctx *gin.Context) {
	var param dto.IDParam
	if err := ctx.ShouldBindUri(&param); err != nil {
		apperror.Response(ctx, apperror.FromValidationError(err))
		return
	}

	grammar, err := h.lookupSvc.GetGrammar(ctx.Request.Context(), param.ID)
	if err != nil {
		apperror.Response(ctx, err)
		return
	}
	ctx.JSON(http.StatusOK, dto.NewGrammarResponse(grammar))
}

// ListGrammar godoc
// @Summary     List grammar by JLPT level
// @Tags        grammar
// @Produce     json
// @Param       jlpt query int false "JLPT Level" default(5)
// @Param       limit query int false "Limit" default(50)
// @Success     200 {array} dto.GrammarResponse
// @Failure     400 {object} apperror.AppError
// @Failure     500 {object} apperror.AppError
// @Security    BearerAuth
// @Router      /grammar [get]
func (h *GrammarHandler) ListGrammar(ctx *gin.Context) {
	var query struct {
		Level int `form:"jlpt,default=5" binding:"omitempty,min=1,max=5"`
	}
	if err := ctx.ShouldBindQuery(&query); err != nil {
		apperror.Response(ctx, apperror.FromValidationError(err))
		return
	}
	if query.Level == 0 {
		query.Level = 5 // default
	}

	var page dto.PaginationQuery
	if err := ctx.ShouldBindQuery(&page); err != nil {
		apperror.Response(ctx, apperror.FromValidationError(err))
		return
	}

	grammars, err := h.lookupSvc.ListGrammarByJLPT(ctx.Request.Context(), query.Level, page.Limit)
	if err != nil {
		apperror.Response(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, dto.NewGrammarListResponse(grammars))
}
